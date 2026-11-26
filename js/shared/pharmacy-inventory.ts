export interface PharmacyInventoryBatch {
  batchNumber: string;
  category: string;
  medicineName: string;
  strength: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  dateReceived: string;
  receivedBy: string;
  supplier: string;
  remarks: string;
}

const STORAGE_KEY = "mhims-pharmacy-inventory-v1";

const initialInventory: PharmacyInventoryBatch[] = [
  {
    batchNumber: "BAT-83921",
    category: "Antibiotic",
    medicineName: "Amoxicillin",
    strength: "500mg",
    expiryDate: "2028-09-30",
    quantity: 450,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-14073",
    category: "Analgesic",
    medicineName: "Paracetamol",
    strength: "500mg",
    expiryDate: "2028-08-31",
    quantity: 1200,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-92584",
    category: "Antibiotic",
    medicineName: "Azithromycin",
    strength: "500mg",
    expiryDate: "2026-11-30",
    quantity: 24,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-31806",
    category: "Anti-TB",
    medicineName: "Rifampicin",
    strength: "500mg",
    expiryDate: "2028-03-31",
    quantity: 180,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-60429",
    category: "Antihistamine",
    medicineName: "Cetirizine",
    strength: "10mg",
    expiryDate: "2026-08-31",
    quantity: 0,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-75138",
    category: "Antidiabetic",
    medicineName: "Metformin",
    strength: "500mg",
    expiryDate: "2028-01-31",
    quantity: 600,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-28941",
    category: "Antihypertensive",
    medicineName: "Amlodipine",
    strength: "10mg",
    expiryDate: "2026-10-31",
    quantity: 15,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-53607",
    category: "Rehydration",
    medicineName: "Oral Rehydration Salts",
    strength: "5mg",
    expiryDate: "2027-06-30",
    quantity: 300,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-41295",
    category: "Antifungal",
    medicineName: "Fluconazole",
    strength: "150mg",
    expiryDate: "2027-12-31",
    quantity: 85,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-87063",
    category: "Bronchodilator",
    medicineName: "Salbutamol Inhaler",
    strength: "100mcg",
    expiryDate: "2026-04-30",
    quantity: 0,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-98216",
    category: "Analgesic",
    medicineName: "Ibuprofen",
    strength: "200mg",
    expiryDate: "2028-07-31",
    quantity: 240,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-42751",
    category: "Antihistamine",
    medicineName: "Loratadine",
    strength: "10mg",
    expiryDate: "2028-05-31",
    quantity: 120,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-59134",
    category: "Antibiotic",
    medicineName: "Cephalexin",
    strength: "500mg",
    expiryDate: "2028-02-29",
    quantity: 350,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-76305",
    category: "Antifungal",
    medicineName: "Clotrimazole",
    strength: "1%",
    expiryDate: "2027-12-31",
    quantity: 75,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-61847",
    category: "Anti-TB",
    medicineName: "Isoniazid",
    strength: "300mg",
    expiryDate: "2028-11-30",
    quantity: 180,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
  {
    batchNumber: "BAT-73042",
    category: "Rehydration",
    medicineName: "Oral Rehydration Salts",
    strength: "1 sachet",
    expiryDate: "2028-06-30",
    quantity: 300,
    unit: "units",
    reorderLevel: 20,
    dateReceived: "",
    receivedBy: "",
    supplier: "",
    remarks: "",
  },
];

function isInventoryBatch(value: unknown): value is PharmacyInventoryBatch {
  if (typeof value !== "object" || value === null) return false;
  const batch = value as Record<string, unknown>;
  return typeof batch.batchNumber === "string"
    && typeof batch.category === "string"
    && typeof batch.medicineName === "string"
    && typeof batch.strength === "string"
    && typeof batch.expiryDate === "string"
    && typeof batch.quantity === "number"
    && Number.isSafeInteger(batch.quantity)
    && batch.quantity >= 0
    && typeof batch.unit === "string"
    && typeof batch.reorderLevel === "number"
    && Number.isSafeInteger(batch.reorderLevel)
    && batch.reorderLevel >= 0
    && typeof batch.dateReceived === "string"
    && typeof batch.receivedBy === "string"
    && typeof batch.supplier === "string"
    && typeof batch.remarks === "string";
}

export function getPharmacyInventory(): PharmacyInventoryBatch[] {
  const storedInventory = window.localStorage.getItem(STORAGE_KEY);
  if (storedInventory === null) return initialInventory.map(batch => ({ ...batch }));

  let parsedInventory: unknown;
  try {
    parsedInventory = JSON.parse(storedInventory);
  } catch {
    throw new Error("Saved pharmacy inventory is not valid JSON.");
  }

  if (!Array.isArray(parsedInventory) || !parsedInventory.every(isInventoryBatch)) {
    throw new Error("Saved pharmacy inventory has an invalid format.");
  }
  return parsedInventory;
}

export function savePharmacyInventory(inventory: PharmacyInventoryBatch[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

export function getAvailableQuantity(
  inventory: PharmacyInventoryBatch[],
  medicineName: string,
  strength: string,
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const normalizedName = medicineName.trim().toLowerCase();
  const normalizedStrength = strength.trim().toLowerCase();

  return inventory.reduce((total, batch) => {
    const matchesMedicine = batch.medicineName.trim().toLowerCase() === normalizedName
      && batch.strength.trim().toLowerCase() === normalizedStrength;
    return matchesMedicine && batch.quantity > 0 && batch.expiryDate >= todayString
      ? total + batch.quantity
      : total;
  }, 0);
}

export function dispenseFromInventory(
  medicineName: string,
  strength: string,
  quantity: number,
): PharmacyInventoryBatch[] {
  const inventory = getPharmacyInventory();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const normalizedName = medicineName.trim().toLowerCase();
  const normalizedStrength = strength.trim().toLowerCase();
  const eligibleBatches = inventory
    .map((batch, index) => ({ batch, index }))
    .filter(({ batch }) => (
      batch.medicineName.trim().toLowerCase() === normalizedName
      && batch.strength.trim().toLowerCase() === normalizedStrength
      && batch.expiryDate >= todayString
      && batch.quantity > 0
    ))
    .sort((left, right) => left.batch.expiryDate.localeCompare(right.batch.expiryDate));
  const availableQuantity = eligibleBatches.reduce((total, { batch }) => total + batch.quantity, 0);

  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > availableQuantity) {
    throw new Error(`Enter a quantity from 1 to ${availableQuantity} units.`);
  }

  let remainingQuantity = quantity;
  eligibleBatches.forEach(({ batch, index }) => {
    if (remainingQuantity === 0) return;
    const deductedQuantity = Math.min(batch.quantity, remainingQuantity);
    inventory[index] = { ...batch, quantity: batch.quantity - deductedQuantity };
    remainingQuantity -= deductedQuantity;
  });

  savePharmacyInventory(inventory);
  return inventory;
}
