const openRule = "";

function textField(id, name, required = false) {
  return {
    system: false,
    id,
    name,
    type: "text",
    required,
    presentable: false,
    unique: false,
    options: {
      min: null,
      max: null,
      pattern: "",
      autogeneratePattern: "",
    },
  };
}

function numberField(id, name, required = false) {
  return {
    system: false,
    id,
    name,
    type: "number",
    required,
    presentable: false,
    unique: false,
    options: {
      min: null,
      max: null,
      noDecimal: false,
    },
  };
}

function fileField(id, name, required = false, maxSize = 5242880) {
  return {
    system: false,
    id,
    name,
    type: "file",
    required,
    presentable: false,
    unique: false,
    options: {
      mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
      thumbs: ["640x0", "1280x0"],
      maxSelect: 1,
      maxSize,
      protected: false,
    },
  };
}

function baseCollection(name, schema, indexes = []) {
  return {
    name,
    type: "base",
    system: false,
    listRule: openRule,
    viewRule: openRule,
    createRule: openRule,
    updateRule: openRule,
    deleteRule: openRule,
    schema,
    indexes,
    options: {},
  };
}

migrate(
  (db) => {
    const dao = new Dao(db);

    const definitions = [
      baseCollection(
        "user_targets",
        [
          numberField("ut_tdee", "tdee", true),
          numberField("ut_cal", "target_calories", true),
          numberField("ut_carb", "target_carbs", true),
          numberField("ut_prot", "target_protein", true),
          numberField("ut_fat", "target_fat", true),
          numberField("ut_wat", "target_water", true),
        ],
        ["CREATE UNIQUE INDEX idx_user_targets_singleton ON user_targets ((1));"]
      ),
      baseCollection(
        "food_library",
        [
          textField("fl_name", "name", true),
          numberField("fl_cal", "calories", false),
          numberField("fl_carb", "carbs", false),
          numberField("fl_prot", "protein", false),
          numberField("fl_fat", "fat", false),
          textField("fl_unit", "unit", false),
          textField("fl_cat", "category", false),
          textField("fl_src", "source", false),
        ],
        ["CREATE INDEX idx_food_library_name ON food_library (name);"]
      ),
      baseCollection(
        "food_records",
        [
          textField("fr_date", "date", true),
          textField("fr_meal", "mealType", true),
          textField("fr_name", "name", true),
          numberField("fr_amt", "amount", true),
          numberField("fr_cal", "calories", true),
          numberField("fr_carb", "carbs", true),
          numberField("fr_prot", "protein", true),
          numberField("fr_fat", "fat", true),
        ],
        [
          "CREATE INDEX idx_food_records_date ON food_records (date);",
          "CREATE INDEX idx_food_records_date_meal ON food_records (date, mealType);",
        ]
      ),
      baseCollection(
        "water_records",
        [
          textField("wr_date", "date", true),
          numberField("wr_amt", "amount", true),
        ],
        ["CREATE INDEX idx_water_records_date ON water_records (date);"]
      ),
      baseCollection(
        "exercise_records",
        [
          textField("er_date", "date", true),
          numberField("er_cal", "calories", true),
        ],
        ["CREATE INDEX idx_exercise_records_date ON exercise_records (date);"]
      ),
      baseCollection(
        "weight_records",
        [
          textField("we_date", "date", true),
          numberField("we_wgt", "weight", false),
          fileField("we_photo", "photo", false),
        ],
        [
          "CREATE UNIQUE INDEX idx_weight_records_date_unique ON weight_records (date);",
          "CREATE INDEX idx_weight_records_date ON weight_records (date);",
        ]
      ),
    ];

    for (const definition of definitions) {
      dao.saveCollection(new Collection(definition));
    }
  },
  (db) => {
    const dao = new Dao(db);
    const collections = [
      "weight_records",
      "exercise_records",
      "water_records",
      "food_records",
      "food_library",
      "user_targets",
    ];

    for (const name of collections) {
      try {
        const collection = dao.findCollectionByNameOrId(name);
        dao.deleteCollection(collection);
      } catch {
        // Ignore missing collection on rollback.
      }
    }
  }
);
