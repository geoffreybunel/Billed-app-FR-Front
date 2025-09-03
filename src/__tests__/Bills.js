/**
 * @jest-environment jsdom
 */

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
      expect(windowIcon.classList.contains('active-icon'));

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((b - a))
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Click on 'Nouvelle note de frais', navigates to NewBill", () => {
      const onNavigate = jest.fn()
      const bills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
      bills.handleClickNewBill()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    })
    test("Click on eye icon, display modal with right image", () => {
      // Arrange
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
    const makeStore = (impl) => ({
      bills: () => ({
        list: impl
      })
    })
    test("getBills calls store.bills().list()", async () => {
      const list = jest.fn().mockResolvedValue([])
      const storeMock = { bills: () => ({ list }) }
      const bills = new Bills({ document, onNavigate: jest.fn(), store: storeMock, localStorage: window.localStorage })
    
      await bills.getBills()
      expect(list).toHaveBeenCalled()
    })
  })
})
