import { expect, test } from "@playwright/test";

test("record hub route should exist", async ({ page }) => {
  await page.goto("/record");
  await expect(page.getByRole("heading", { name: "快捷记录" })).toBeVisible();
  await expect(page.getByRole("link", { name: "体重记录" })).toBeVisible();
  await expect(page.getByRole("link", { name: "体型照记录" })).toBeVisible();
});

test("home should show meal record sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "早餐", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "午餐", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "晚餐", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "加餐", exact: true })).toBeVisible();
});

test("photo record page should be accessible", async ({ page }) => {
  await page.goto("/record/photo");
  await expect(page.getByRole("heading", { name: "体型照记录" })).toBeVisible();
});

test("weight trend page should support 7/30/90 day switches", async ({ page }) => {
  await page.goto("/record/weight");
  await expect(page.getByRole("heading", { name: "体重记录" })).toBeVisible();
  await expect(page.getByRole("button", { name: "7天" })).toBeVisible();
  await expect(page.getByRole("button", { name: "30天" })).toBeVisible();
  await expect(page.getByRole("button", { name: "90天" })).toBeVisible();
});

test("weight input should not overflow on mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/record/weight");
  const weightInput = page.getByPlaceholder("70.0");
  await expect(weightInput).toBeVisible();

  const metrics = await weightInput.evaluate((element) => {
    const inputRect = element.getBoundingClientRect();
    const root = document.documentElement;
    return {
      inputRight: inputRect.right,
      viewportWidth: window.innerWidth,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
    };
  });

  expect(metrics.inputRight).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test("fab should include quick water action", async ({ page }) => {
  await page.goto("/");
  const waterText = page.locator("p", { hasText: "ml" }).first();
  const before = await waterText.textContent();
  const beforeValue = Number((before ?? '0').split('/')[0].trim());
  await page.getByRole("button", { name: "快捷记录" }).click();
  await expect(page.getByRole("button", { name: "饮水 +250ml" })).toBeVisible();
  await page.getByRole("button", { name: "饮水 +250ml" }).click();
  await expect
    .poll(async () => {
      const after = await waterText.textContent();
      return Number((after ?? '0').split('/')[0].trim());
    })
    .toBeGreaterThanOrEqual(beforeValue + 250);
});

test("custom food form should include macros fields", async ({ page }) => {
  await page.goto("/record/food?type=breakfast");
  await page.getByRole("button", { name: "自定义添加" }).click();
  await expect(page.getByPlaceholder("碳水 (每 100g)")).toBeVisible();
  await expect(page.getByPlaceholder("蛋白质 (每 100g)")).toBeVisible();
  await expect(page.getByPlaceholder("脂肪 (每 100g)")).toBeVisible();
});

test("food page should load items from FoodLibrary table", async ({ page }) => {
  await page.goto("/record/food?type=breakfast");
  await page.getByPlaceholder("搜索食物...").fill("豆浆");
  await expect(page.locator("p", { hasText: "豆浆" }).first()).toBeVisible();
});

test("profile should support 20% and 30% calorie deficits", async ({ page }) => {
  await page.goto("/profile");

  const calorieInput = page.getByLabel("总热量 (kcal)");
  const calcBtn = page.getByRole("button", { name: "自动计算目标" });

  await page.locator('label[for="deficit-20"]').click();
  await calcBtn.click();
  const cal20 = Number(await calorieInput.inputValue());

  await page.locator('label[for="deficit-30"]').click();
  await calcBtn.click();
  const cal30 = Number(await calorieInput.inputValue());

  expect(cal30).toBeLessThan(cal20);
});
