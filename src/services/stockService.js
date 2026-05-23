import { patchXml, postXml, requestXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

// ─────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────

const formatDateNow = () => {
    const now = new Date();
    return (
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + " " +
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ":" +
        String(now.getSeconds()).padStart(2, "0")
    );
};

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

const parseStockAvailable = (item, fallback = {}) => ({
    id:          getValue(item.id),
    productId:   getValue(item.id_product)           || String(fallback.productId   ?? ""),
    attributeId: getValue(item.id_product_attribute) || String(fallback.attributeId ?? ""),
    quantity:    Number(getValue(item.quantity) || 0),
    updatedAt:   getValue(item.date_upd),
});

const parseStockMovement = (item) => {
    const physicalQuantity = Number(getValue(item.physical_quantity) || 0);
    const sign             = Number(getValue(item.sign) || 1);
    const dateAdd          = getValue(item.date_add);
    return {
        id:          getValue(item.id),
        productId:   Number(getValue(item.id_product)),
        attributeId: Number(getValue(item.id_product_attribute)),
        stockId:     Number(getValue(item.id_stock)),
        delta:       physicalQuantity * sign,
        dateAdd,
        date:        dateAdd.split(" ")[0], // YYYY-MM-DD
    };
};

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchStockAvailableList = async () => {
    try {
        const xmlText = await requestXml("stock_availables?display=full");
        const items = parseXmlToJson(xmlText)?.prestashop?.stock_availables?.stock_available || [];
        const arr = Array.isArray(items) ? items : [items];
        return arr.map((item) => parseStockAvailable(item));
    } catch (err) {
        console.error("Failed to fetch stock availables list:", err);
        return [];
    }
};

export const fetchStockAvailable = async (productId, attributeId = 0) => {
    const xmlText = await requestXml(
        `stock_availables?filter[id_product]=[${productId}]&filter[id_product_attribute]=[${attributeId}]&display=full`,
    );
    const item = parseXmlToJson(xmlText)?.prestashop?.stock_availables?.stock_available;
    if (!item) return null;

    const single = Array.isArray(item) ? item[0] : item;
    return parseStockAvailable(single, { productId, attributeId });
};

export const getAllStockMovementsByProduct = async (productId, attributeId) => {
    const stock = await fetchStockAvailable(productId, attributeId);
    if (!stock) return [];

    try {
        const xmlText = await requestXml(`stock_movements?filter[id_stock]=[${stock.id}]&display=full`);
        const items = parseXmlToJson(xmlText)?.prestashop?.stock_movements?.stock_mvt || [];
        const arr = Array.isArray(items) ? items : [items];

        const movements = arr.map(parseStockMovement);
        movements.sort((a, b) => a.dateAdd.localeCompare(b.dateAdd));

        // Reconstruit la quantité courante après chaque mouvement
        const totalDeltaSum = movements.reduce((sum, m) => sum + m.delta, 0);
        let runningQuantity = stock.quantity - totalDeltaSum;
        movements.forEach((m) => {
            runningQuantity += m.delta;
            m.quantityAfter = runningQuantity;
        });

        return movements;
    } catch (err) {
        console.error("Failed to fetch stock movements from server:", err);
        return [];
    }
};

// ─────────────────────────────────────────────
// Mise à jour
// ─────────────────────────────────────────────

const postStockMovement = async (stockId, productId, attributeId, delta, dateAdd = null) => {
    const sign     = delta > 0 ? 1 : -1;
    const reasonId = delta > 0 ? 1 : 2; // 1 = Augmentation, 2 = Diminution
    const quantity = Math.abs(delta);
    const date     = dateAdd ?? formatDateNow();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <stock_mvt>
    <id_product><![CDATA[${productId}]]></id_product>
    <id_product_attribute><![CDATA[${attributeId}]]></id_product_attribute>
    <id_warehouse><![CDATA[0]]></id_warehouse>
    <id_currency><![CDATA[1]]></id_currency>
    <id_employee><![CDATA[1]]></id_employee>
    <id_stock><![CDATA[${stockId}]]></id_stock>
    <id_stock_mvt_reason><![CDATA[${reasonId}]]></id_stock_mvt_reason>
    <physical_quantity><![CDATA[${quantity}]]></physical_quantity>
    <sign><![CDATA[${sign}]]></sign>
    <price_te><![CDATA[0.00]]></price_te>
    <date_add><![CDATA[${date}]]></date_add>
  </stock_mvt>
</prestashop>`;

    await postXml("stock_movements", xml);
};

export const applyStockDelta = async (productId, attributeId, delta) => {
   const stock = await updateStock(productId, attributeId, delta, formatDateNow());

    try {
        const updatedStock = await fetchStockAvailable(productId, attributeId);
        if (updatedStock) return updatedStock;
    } catch (err) {
        console.error("Failed to fetch updated stock, using local calculation:", err);
    }

    return { ...stock, quantity: Math.max(0, Number(stock.quantity || 0) + Number(delta)) };
};

export const updateStock = async (productId, combinationId, quantity, dateAdd) => {
    const stock = await fetchStockAvailable(productId, combinationId);
    if (!stock?.id) return;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <stock_available>
    <id><![CDATA[${stock.id}]]></id>
    <id_product><![CDATA[${productId}]]></id_product>
    <id_product_attribute><![CDATA[${combinationId}]]></id_product_attribute>
    <quantity><![CDATA[${quantity}]]></quantity>
    <depends_on_stock><![CDATA[0]]></depends_on_stock>
    <out_of_stock><![CDATA[1]]></out_of_stock>
  </stock_available>
</prestashop>`;

    await patchXml("stock_availables", xml);

    if (quantity > 0 && dateAdd) {
        const fullDate = dateAdd.length === 10 ? `${dateAdd} 00:00:00` : dateAdd;
        await postStockMovement(stock.id, productId, combinationId, quantity, fullDate);
    }
    return stock;
};