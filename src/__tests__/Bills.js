/**
 * @jest-environment jsdom
 */

// For integration test
import mockStore from "../__mocks__/store";
jest.mock("../app/Store.js", () => ({
  __esModule: true,
  default: mockStore,
}));
//

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')); //* added
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a.date < b.date) ? -1 : 1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // * Tests added
    test("Click on 'Nouvelle note de frais', navigates to NewBill", () => {
      const onNavigate = jest.fn()
      const bills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
      bills.handleClickNewBill()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    })

    test("Click on eye icon, display modal with right image", () => {
      document.body.innerHTML = `
      <div id="modaleFile" class="modal">
        <div class="modal-body"></div>
      </div>
      <div data-testid="icon-eye" data-bill-url="http://localhost:5678/public/test.png"></div>
      `
      const icon = screen.getByTestId("icon-eye")
      $.fn.modal = jest.fn() // mock de Bootstrap modal
      const bills = new Bills({ document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage })

      // Act
      bills.handleClickIconEye(icon)

      // Assert
      const modalBody = document.querySelector("#modaleFile .modal-body")
      expect(modalBody.innerHTML).toContain('src="http://localhost:5678/public/test.png"')
      expect($.fn.modal).toHaveBeenCalledWith("show")
    })
    // const makeStore = (impl) => ({
    //   bills: () => ({
    //     list: impl
    //   })
    // })

    test("getBills calls store.bills().list()", async () => {
      const list = jest.fn().mockResolvedValue([])
      const storeMock = { bills: () => ({ list }) }
      const bills = new Bills({ document, onNavigate: jest.fn(), store: storeMock, localStorage: window.localStorage })
    
      await bills.getBills()
      expect(list).toHaveBeenCalled()
    })
  })
})

// * Integration test
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();

      // Au moins un œil visible
      const eyes = await screen.findAllByTestId("icon-eye");
      expect(eyes.length).toBeGreaterThan(0);
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Erreur 404")),
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Erreur 500")),
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});