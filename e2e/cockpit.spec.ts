import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * E2E for the J1+J2 cockpit. Beyond clicking through the 4 demo scenarios, the key test
 * asserts the MEASUREMENT APPARATUS: that `case.opened` → `decision.made` actually land in
 * `/api/events`, ordered, with the right caseId — i.e. that "time cockpit→decision" is
 * computable. This is the test that would have caught the `sendBeacon` drop bug.
 */

type TrackedEvent = {
  ts: number;
  type: string;
  caseId?: string;
  payload?: { decision?: string; status?: string } & Record<string, unknown>;
};

async function fetchEvents(request: APIRequestContext): Promise<TrackedEvent[]> {
  const res = await request.get("/api/events");
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as TrackedEvent[];
}

test.describe("Cockpit analyste — parcours & apparatus de mesure", () => {
  test("la liste charge les 4 dossiers et émet case.list.viewed", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await expect(page.locator('a[href^="/cases/"]')).toHaveCount(4);
    await expect.poll(async () =>
      (await fetchEvents(request)).some((e) => e.type === "case.list.viewed"),
    ).toBeTruthy();
  });

  test("no-brainer Brasserie : approbation → pipeline case.opened → decision.made calculable", async ({
    page,
    request,
  }) => {
    await page.goto("/cases/fr-001");
    await page
      .getByLabel(/Justification/i)
      .fill("Bonne rentabilité, 0 red flag — accord.");
    await page.getByRole("button", { name: "Approuver" }).click();

    await expect
      .poll(
        async () => {
          const events = await fetchEvents(request);
          const opened = events.find(
            (e) => e.type === "case.opened" && e.caseId === "fr-001",
          );
          const decided = events.find(
            (e) => e.type === "decision.made" && e.caseId === "fr-001",
          );
          return Boolean(
            opened &&
              decided &&
              decided.ts >= opened.ts &&
              decided.payload?.decision === "approve",
          );
        },
        { timeout: 15_000 },
      )
      .toBeTruthy();
  });

  test("refus Transport Leclerc : la modale de confirmation garde-fou la décision", async ({
    page,
    request,
  }) => {
    await page.goto("/cases/fr-003");
    await page
      .getByLabel(/Justification/i)
      .fill("Endettement excessif, flux dégradés — refus.");
    await page.getByRole("button", { name: "Refuser" }).click();

    // The decision must go through the confirmation modal — it is not recorded on the first click.
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Refuser le dossier" }).click();

    await expect
      .poll(
        async () =>
          (await fetchEvents(request)).some(
            (e) =>
              e.type === "decision.made" &&
              e.caseId === "fr-003" &&
              e.payload?.decision === "reject",
          ),
        { timeout: 15_000 },
      )
      .toBeTruthy();
  });

  test("différenciation produit : la section factoring n'apparaît que sur un dossier affacturage", async ({
    page,
  }) => {
    // Loan case (Brasserie) → no factoring section.
    await page.goto("/cases/fr-001");
    await expect(
      page.getByText("Qualité créances (affacturage)"),
    ).toHaveCount(0);

    // Factoring case (Fleurs de Saison) → factoring section present.
    await page.goto("/cases/fr-004");
    await expect(
      page.getByText("Qualité créances (affacturage)"),
    ).toBeVisible();
  });
});
