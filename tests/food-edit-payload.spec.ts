import { expect, test } from "@playwright/test";

test("editing food should patch only writable fields", async ({ page }) => {
  let foodRecord = {
    id: "food_12",
    date: "2026-02-25",
    mealType: "breakfast",
    name: "鸡蛋",
    amount: 120,
    calories: 170,
    carbs: 1.2,
    protein: 14.8,
    fat: 11.1,
    created_at: "2026-02-25T10:00:00.000Z",
    updated_at: "2026-02-25T11:00:00.000Z",
  };
  let patchedPayload: Record<string, unknown> | null = null;

  await page.route("**/api/collections/*/records**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const segments = url.pathname.split("/").filter(Boolean);
    const collection = segments[2] ?? "";

    if (req.method() === "PATCH" && collection === "food_records") {
      patchedPayload = JSON.parse(req.postData() ?? "{}");
      foodRecord = { ...foodRecord, ...(patchedPayload as typeof foodRecord) };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(foodRecord),
      });
      return;
    }

    if (req.method() === "GET") {
      if (collection === "food_records") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [foodRecord], page: 1, perPage: 200, totalItems: 1, totalPages: 1 }),
        });
        return;
      }
      if (collection === "water_records" || collection === "exercise_records" || collection === "weight_records") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [], page: 1, perPage: 200, totalItems: 0, totalPages: 1 }),
        });
        return;
      }
      if (collection === "user_targets") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "target_1",
                target_calories: 2000,
                target_carbs: 250,
                target_protein: 150,
                target_fat: 55,
                target_water: 2000,
                tdee: 2000,
              },
            ],
            page: 1,
            perPage: 1,
            totalItems: 1,
            totalPages: 1,
          }),
        });
        return;
      }
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ list: [] }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "编辑早餐" }).click();
  await page.getByRole("button", { name: "编辑记录" }).click();
  await page.getByRole("button", { name: "修改鸡蛋" }).click();
  await page.getByLabel("克数").fill("150");
  await page.getByRole("button", { name: "保存" }).click();

  await expect.poll(() => patchedPayload).not.toBeNull();

  expect(patchedPayload).toMatchObject({
    date: "2026-02-25",
    mealType: "breakfast",
    name: "鸡蛋",
    amount: 150,
  });
  expect("Id" in (patchedPayload ?? {})).toBe(false);
  expect("created_at" in (patchedPayload ?? {})).toBe(false);
  expect("updated_at" in (patchedPayload ?? {})).toBe(false);
});
