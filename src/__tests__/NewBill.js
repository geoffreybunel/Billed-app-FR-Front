/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
    })

    test("Should submit the form with valid data", async () => {
      // Mock du localStorage
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "test@email.com" })
      );
    
      // Navigation et rendu
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      document.body.innerHTML = NewBillUI();
    
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
    
      // Préremplir le formulaire
      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Vol retour";
      screen.getByTestId("amount").value = "300";
      screen.getByTestId("datepicker").value = "2023-01-01";
      screen.getByTestId("vat").value = "70";
      screen.getByTestId("pct").value = "20";
      screen.getByTestId("commentary").value = "Retour depuis Paris";
    
      // Simuler fichier (optionnel)
      newBill.fileUrl = "test.jpg";
      newBill.fileName = "test.jpg";
    
      // Simuler le submit
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
    
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
    });

    test("Should handle valid file upload", () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
    
      const fileInput = screen.getByTestId("file");
      const file = new File(["dummy content"], "test.png", { type: "image/png" });
    
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener("change", handleChangeFile);
    
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
    
      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("test.png");
    });
  })
})
