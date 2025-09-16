/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

// Mock de l'API pour simuler les appels avec les données nécessaires
jest.mock("../__mocks__/store.js", () => {
  return {
    __esModule: true,
    default: {
      bills: () => {
        return {
          create: jest.fn(() =>
            Promise.resolve({ fileUrl: "test-url", key: "test-key" })
          ),
          list: jest.fn(() => Promise.resolve([])),
          update: jest.fn(() => Promise.resolve()),
        };
      },
    },
  };
});

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
        document.body.innerHTML = ROUTES_PATH[pathname];
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

    describe("When I upload a wrong file format", () => {
      test("Then it should alert, reset the input and not call create", () => {
        // Contexte minimal (UI + localStorage + instance)
        document.body.innerHTML = NewBillUI();
    
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "test@email.com" })
        );
    
        const onNavigate = jest.fn();
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
    
        // On espionne l'alerte et l'API create
        window.alert = jest.fn();
        const createSpy = jest.spyOn(mockStore.bills(), "create");
    
        // Upload d'un PDF (fichier interdit)
        const fileInput = screen.getByTestId("file");
        const wrongFile = new File(["dummy"], "juste-un-doc.pdf", {
          type: "application/pdf",
        });
    
        fireEvent.change(fileInput, { target: { files: [wrongFile] } });
    
        // Attentes
        expect(window.alert).toHaveBeenCalledWith(
          "Le document doit être une image .jpg, .jpeg ou .png"
        );
        expect(fileInput.value).toBe("");       // input vidé
        expect(newBill.fileUrl).toBeNull();     // pas d'URL
        expect(newBill.billId).toBeNull();      // pas d'ID créé
        expect(createSpy).not.toHaveBeenCalled(); // aucune création côté store
      });
    });
  })

  // TEST D'INTÉGRATION - POST new bill
  describe("When I am on NewBill Page and I submit the form", () => {
    test("Then the new bill should be created and I should be redirected to the bills page", async () => {
      // Préparation de l'environnement de test
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "test@email.com",
        })
      );

      // Création d'espions pour les méthodes de l'API
      const createBillSpy = jest.spyOn(mockStore.bills(), "create");
      const updateBillSpy = jest.spyOn(mockStore.bills(), "update");

      // Simulation de la navigation avec un mock simple
      const onNavigate = jest.fn();
      document.body.innerHTML = NewBillUI();

      // Instanciation de la classe NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Remplissage des champs
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Vol Paris-New York" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: 800 } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-09-12" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: 160 } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: 20 } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Voyage d'affaires" } });

      // Simulation de l'envoi du fichier
      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const inputFile = screen.getByTestId("file");
      fireEvent.change(inputFile, { target: { files: [file] } });
      // ! Error 404 500
      // ! Test dans le cas où ça marche pas

      // Simulation de la soumission du formulaire
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);
 
      // Vérifier si la navigation a bien eu lieu
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
    });
  });

  // --- Tests d'erreurs API sur update() ---
  describe("When I submit a new bill and API returns an error", () => {
    beforeEach(() => {
      // État minimal pour chaque test
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "test@email.com" })
      );
      document.body.innerHTML = NewBillUI();

      // On va surcharger mockStore.bills() dans chaque test
      jest.spyOn(mockStore, "bills");

      // On capture les erreurs
      console.error = jest.fn();
    });

    const fillMinimalForm = () => {
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Erreur test" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "100" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-09-12" } });
    };

    test("Then it should log error 404 in console", async () => {
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // On évite handleChangeFile en injectant des valeurs cohérentes
      newBill.fileUrl = "url";
      newBill.fileName = "file.png";
      newBill.billId = "id-404";

      fillMinimalForm();

      // La prochaine fois que NewBill appellera store.bills(),
      // on renvoie un objet dont update() rejette avec "Erreur 404"
      mockStore.bills.mockImplementationOnce(() => ({
        update: () => Promise.reject(new Error("Erreur 404")),
        create: jest.fn(() => Promise.resolve({ fileUrl: "url", key: "id-404" })),
        list: jest.fn(() => Promise.resolve([])),
      }));

      fireEvent.submit(screen.getByTestId("form-new-bill"));

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    test("Then it should log error 500 in console", async () => {
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      newBill.fileUrl = "url";
      newBill.fileName = "file.png";
      newBill.billId = "id-500";

      fillMinimalForm();

      mockStore.bills.mockImplementationOnce(() => ({
        update: () => Promise.reject(new Error("Erreur 500")),
        create: jest.fn(() => Promise.resolve({ fileUrl: "url", key: "id-500" })),
        list: jest.fn(() => Promise.resolve([])),
      }));

      fireEvent.submit(screen.getByTestId("form-new-bill"));

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
})