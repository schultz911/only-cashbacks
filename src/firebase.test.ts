import { test, expect, describe } from "vitest";
import { handleFirestoreError, OperationType } from "./firebase";
import { auth } from "./firebase";

describe("firebase error handling", () => {
    test("does not log PII in handleFirestoreError", () => {
        // mock auth current user
        (auth as any).currentUser = {
            uid: "123",
            email: "test@example.com",
            emailVerified: true,
            isAnonymous: false,
            tenantId: "tenant1",
            providerData: [{
                providerId: "google",
                email: "test@example.com"
            }]
        };

        const originalConsoleError = console.error;
        let loggedError = "";
        console.error = (msg: string, ...args: any[]) => {
            loggedError = args.length > 0 ? args[0] : msg;
        };

        try {
            handleFirestoreError(new Error("Test Error"), OperationType.GET, "/path");
        } catch (e: any) {
             const errorObj = JSON.parse(loggedError);
             expect(errorObj.authInfo.email).toBeUndefined();
             expect(errorObj.authInfo.providerInfo).toBeUndefined();
             expect(e.firestoreInfo.authInfo.email).toBeUndefined();
             expect(e.firestoreInfo.authInfo.providerInfo).toBeUndefined();
        } finally {
            console.error = originalConsoleError;
        }
    });
});
