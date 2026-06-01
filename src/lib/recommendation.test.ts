import { describe, expect, test, setSystemTime, afterEach } from "bun:test";
import { getCycleForCard } from "./recommendation";

describe("recommendation utils", () => {
  afterEach(() => {
    // Reset system time after each test
    setSystemTime();
  });

  describe("getCycleForCard", () => {
    test("returns current cycle when today is after or equal to the bill date", () => {
      // Set time to May 15, 2024
      setSystemTime(new Date("2024-05-15T12:00:00Z"));

      // Bill date is 10th
      const result = getCycleForCard("sbi-cashback", { "sbi-cashback": 10 });
      expect(result).toBe("2024-5");
    });

    test("returns previous cycle when today is before the bill date", () => {
      // Set time to May 15, 2024
      setSystemTime(new Date("2024-05-15T12:00:00Z"));

      // Bill date is 20th
      const result = getCycleForCard("sbi-cashback", { "sbi-cashback": 20 });
      expect(result).toBe("2024-4");
    });

    test("handles month wraparound for previous cycle (January -> December)", () => {
      // Set time to January 15, 2024
      setSystemTime(new Date("2024-01-15T12:00:00Z"));

      // Bill date is 20th
      const result = getCycleForCard("sbi-cashback", { "sbi-cashback": 20 });
      expect(result).toBe("2023-12");
    });

    test("defaults to bill day 1 if not specified in cardBillDates", () => {
      // Set time to May 15, 2024
      setSystemTime(new Date("2024-05-15T12:00:00Z"));

      // No bill date specified, defaults to 1, so 15 >= 1
      const result = getCycleForCard("sbi-cashback", {});
      expect(result).toBe("2024-5");
    });

    test("forces bill day to 1 for Debit cards regardless of provided date", () => {
      // Set time to May 15, 2024
      setSystemTime(new Date("2024-05-15T12:00:00Z"));

      // Bill date is 20th, but kotak-811-infinity is a Debit card
      const result = getCycleForCard("kotak-811-infinity", { "kotak-811-infinity": 20 });
      // Would be 2024-4 if it used the 20th, but it forces 1st, so 15 >= 1 -> 2024-5
      expect(result).toBe("2024-5");
    });
  });
});
