// Imports Vitest : describe (groupe), expect (assertions), it (un test),
// vi (mocks), beforeEach (setup avant chaque test).
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock de api hoisté : 3 méthodes utilisées par inscriptionService (get/post/delete).
const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

// Remplace ./axiosConfig par notre mock.
vi.mock("./axiosConfig", () => ({
    default: apiMock,
}));

import inscriptionService from "./inscriptionService";

describe("inscriptionService", () => {
    // Reset des mocks avant chaque test.
    beforeEach(() => {
        apiMock.get.mockReset();
        apiMock.post.mockReset();
        apiMock.delete.mockReset();
    });

    // Test 1 : sInscrire appelle POST /formations/{id}/inscription et retourne data.
    it("sInscrire", async () => {
        apiMock.post.mockResolvedValue({ data: { ok: true } });
        const result = await inscriptionService.sInscrire(5);
        // Pas de body : Laravel récupère l'apprenant via le JWT.
        expect(apiMock.post).toHaveBeenCalledWith("/formations/5/inscription");
        // Le service unwrap response.data.
        expect(result).toEqual({ ok: true });
    });

    // Test 2 : seDesinscrire utilise la même URL en DELETE.
    it("seDesinscrire", async () => {
        apiMock.delete.mockResolvedValue({ data: { ok: true } });
        const result = await inscriptionService.seDesinscrire(5);
        expect(apiMock.delete).toHaveBeenCalledWith("/formations/5/inscription");
        expect(result).toEqual({ ok: true });
    });

    // Test 3 : mesFormations unwrap l'objet { inscriptions: [...] } en tableau direct.
    it("mesFormations retourne inscriptions", async () => {
        apiMock.get.mockResolvedValue({ data: { inscriptions: [{ id: 1 }] } });
        const result = await inscriptionService.mesFormations();
        expect(apiMock.get).toHaveBeenCalledWith("/apprenant/formations");
        // Le service ne renvoie PAS l'objet entier, juste le tableau pour les composants.
        expect(result).toEqual([{ id: 1 }]);
    });

    // Test 4 : si data ne contient pas "inscriptions", on retourne un tableau vide
    // (sécurité pour éviter les crashs au .map() côté composant).
    it("mesFormations retourne tableau vide par defaut", async () => {
        apiMock.get.mockResolvedValue({ data: {} });
        const result = await inscriptionService.mesFormations();
        expect(result).toEqual([]);
    });
});
