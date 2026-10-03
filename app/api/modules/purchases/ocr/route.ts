import { NextResponse } from 'next/server';
import { sampleInvoices } from '@/lib/sample-invoices';
import { createDraftLineItem, roundMoney, type PurchasePaymentMethod, type PurchaseLineItem } from '@/lib/purchase-data';
import { parseDateString, type ParsedPurchaseOcr } from '@/lib/purchase-parser';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sampleId, imageBase64, mimeType = 'image/jpeg', apiKey } = body;

    // 1. If sample invoice requested, return verified sample immediately
    if (sampleId) {
      const sample = sampleInvoices.find((s) => s.id === sampleId);
      if (sample) {
        return NextResponse.json({
          success: true,
          source: 'sample',
          parsed: sample.parsed,
        });
      }
    }

    // 2. Determine Gemini API Key
    const key = apiKey || process.env.GEMINI_API_KEY || '';

    if (!key) {
      return NextResponse.json({
        success: false,
        requiresKey: true,
        message: 'Gemini API Key is required for live AI OCR. Please provide your Gemini API key, or use one of the 3 built-in sample invoices.',
      });
    }

    if (!imageBase64) {
      return NextResponse.json({
        success: false,
        message: 'No image data provided for OCR analysis.',
      }, { status: 400 });
    }

    // 3. Call Gemini Vision API with automatic model fallbacks
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
    ];

    const prompt = `You are a high-precision medical & pharmaceutical distributor invoice parser AI.
Carefully examine this invoice / bill photo and extract EVERY SINGLE detail into a pure JSON object.
Return ONLY valid raw JSON with this exact schema (no markdown formatting, no backticks):
{
  "isBlurry": false,
  "blurWarning": "",
  "supplierName": "Full distributor or supplier company name (e.g. Premier Sales (Private) Limited)",
  "orderNo": "Invoice / Bill / Challan number (e.g. 460270 or 612832)",
  "invoiceReference": "Supply ID or delivery reference code if present (e.g. 2025-68303-460270-1)",
  "orderDate": "YYYY-MM-DD",
  "paymentMethod": "Cash" | "Credit" | "Bank Transfer" | "Card",
  "notes": "Manufacturer name or notes (e.g. PHARMEVO (PVT) LIMITED or HIGHNOON)",
  "subtotal": 31098.00,
  "taxAmount": 159.15,
  "totalAmount": 31989.37,
  "items": [
    {
      "itemCode": "Item code (e.g. 13543)",
      "medicine": "Clean product/medicine name with potency/form (e.g. ANPLAG 90MG TAB CP)",
      "pack": "pack type/size (e.g. 10S, 14S, TAB, CAP)",
      "qty": 3,
      "bonusQty": 0,
      "unitPrice": 1445.00,
      "discountPercent": 0,
      "lineTotal": 4335.00,
      "batchNo": "Batch number only (e.g. 5L022)",
      "expiryDate": "YYYY-MM-DD"
    }
  ]
}

CRITICAL RULES FOR ACCURATE EXTRACTION:
1. EXHAUSTIVE EXTRACTION - DO NOT OMIT ANY PRODUCT ROW:
   - Many pharmaceutical invoices contain 10, 20, 30, 40, or 50+ products on a single sheet.
   - You MUST extract EVERY SINGLE ROW from the first product row to the last product row without skipping, stopping, truncating, or summarizing any items.
   - Do NOT use "..." or placeholder text. Extract all items completely.

2. ACCURATE COLUMN MAPPING FOR PAKISTANI PHARMA INVOICES:
   - [Item Name / Description]: Full medicine title including strength/potency and formulation (e.g. "AUGMENTIN 625MG TAB", "PANADOL 500MG 20X10", "ARBI 300 MG TAB"). Clean off any leading row numbers or asterisks.
   - [TP / Rate / Trade Price]: This is the purchase Unit Price (Trade Price). Extract this as 'unitPrice'. DO NOT extract the retail price (MRP) as unitPrice!
   - [Qty / Quantity]: Actual purchased quantity (e.g. 1, 2, 3, 5, 10, 25). Every invoiced item MUST have qty >= 1! NEVER put 0 in qty!
   - [Bonus / Free Qty]: Free bonus units if any (usually 0). Put this in 'bonusQty'. DO NOT confuse Bonus with Qty!
   - [Batch / Expiry]: Often formatted together like "5L022 /9-27" or "5H131 06/27". Separate them: batchNo = "5L022", expiryDate = "2027-09-30".
   - [Expiry Date]: Standardize all expiry dates to YYYY-MM-DD using the last day of the expiry month (e.g. "9-27" -> "2027-09-30", "06/26" -> "2026-06-30").
   - [Discount %]: If there is a discount column (e.g. 5%, 8%, 10%), record it in 'discountPercent'.
   - [Amount / Net Amount]: The total line amount for that row.

3. HEADER & TOTALS:
   - Extract 'supplierName' from the top header of the bill (e.g. Premier Sales, Muller & Phipps, Searle, Getz, OBS, Martin Dow, etc.).
   - Extract 'orderNo' (Invoice # or Bill # or DC #) from the header.
   - Extract 'subtotal' (Gross / Net amount before tax).
   - Extract 'taxAmount' (Advance Tax u/s 236H / 236G, GST, or other taxes printed near the bottom).
   - Extract 'totalAmount' (the final Net Payable / Grand Total).

4. BLUR DETECTION:
   - If the image is completely illegible or out of focus, set "isBlurry": true and provide a descriptive "blurWarning". Otherwise "isBlurry": false.`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
        max_output_tokens: 16384,
      },
    };

    let rawContent = '';
    let lastError = '';

    // Try models with auto-retry on 503 (transient Google high demand)
    for (const model of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload),
            signal: AbortSignal.timeout(45000),
          });

          if (response.ok) {
            const data = await response.json();
            rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawContent) break;
          } else {
            const err = await response.text();
            if (response.status === 429) {
              return NextResponse.json({
                success: false,
                isRateLimit: true,
                message: '⚠️ Gemini API Free Tier limit reached (15 requests/minute). Please wait 20-30 seconds and click Scan again.',
              }, { status: 429 });
            }
            lastError = `${model} (${response.status}): ${err.slice(0, 150)}`;
            if (response.status === 503 && attempt < 2) {
              await new Promise((r) => setTimeout(r, 1500));
              continue;
            }
            break;
          }
        } catch (e: any) {
          lastError = e?.message || 'Network error';
        }
      }
      if (rawContent) break;
    }

    if (!rawContent) {
      return NextResponse.json({
        success: false,
        message: `Gemini API request failed: ${lastError}`,
      }, { status: 502 });
    }

    // Clean any markdown formatting if present
    const cleanJson = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsedGemini = JSON.parse(cleanJson);

    const paymentMethod: PurchasePaymentMethod = ['Cash', 'Credit', 'Bank Transfer', 'Card', 'Mobile Wallet'].includes(parsedGemini.paymentMethod)
      ? parsedGemini.paymentMethod
      : 'Credit';

    const today = new Date().toISOString().slice(0, 10);
    const warnings: string[] = [];
    let expiriesDetected = 0;
    let batchesDetected = 0;

    // Check blur status
    const isBlurry = Boolean(
      parsedGemini.isBlurry ||
      (parsedGemini.blurWarning && parsedGemini.blurWarning.trim().length > 0) ||
      (!parsedGemini.items || parsedGemini.items.length === 0)
    );

    const blurWarning = isBlurry
      ? (parsedGemini.blurWarning || '⚠️ Blur Picture Warning: Invoice image appears blurry or difficult to read. Details may not be 100% accurate. Please upload a clear photo.')
      : undefined;

    if (blurWarning) {
      warnings.push(blurWarning);
    }

    const items = (parsedGemini.items || []).map((it: any, idx: number) => {
      let batchNo = it.batchNo ? String(it.batchNo).trim() : '';
      let expiryDate = it.expiryDate ? String(it.expiryDate).trim() : '';

      // If batch contains combined batch/expiry (e.g. "5L022/9-27" or "252144/6-27")
      if (batchNo.includes('/') && !expiryDate) {
        const parts = batchNo.split('/');
        batchNo = parts[0].trim();
        const rawExp = parts[1].trim();
        const parsedExp = parseDateString(rawExp);
        if (parsedExp) expiryDate = parsedExp;
      } else if (batchNo.includes('/')) {
        batchNo = batchNo.split('/')[0].trim();
      }

      // Ensure expiry is in valid YYYY-MM-DD
      if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
        const parsedExp = parseDateString(expiryDate);
        if (parsedExp) expiryDate = parsedExp;
      }

      // Clean medicine name (remove leading row numbers, bullets, asterisks)
      let medicineName = String(it.medicine || `Medicine ${idx + 1}`).replace(/^[*#\d\.\-\s]+/, '').trim();

      if (expiryDate) {
        expiriesDetected++;
        if (expiryDate < today) {
          warnings.push(`Warning: Item "${medicineName}" has an EXPIRED date (${expiryDate}).`);
        }
      }
      if (batchNo) {
        batchesDetected++;
      }

      let rawQty = Number(it.qty ?? 0);
      let unitPrice = Number(it.unitPrice ?? it.tp ?? it.purchasePrice ?? it.price ?? 0);
      let lineTotal = Number(it.lineTotal ?? it.amount ?? it.netAmount ?? 0);
      const discountPercent = Number(it.discountPercent ?? it.discount ?? 0);

      // Intelligent Self-Healing & Validation:
      // If rawQty is missing/zero but lineTotal and unitPrice are present:
      if (rawQty <= 0 && unitPrice > 0 && lineTotal > 0) {
        rawQty = Math.max(1, Math.round(lineTotal / unitPrice));
      } else if (unitPrice <= 0 && rawQty > 0 && lineTotal > 0) {
        unitPrice = roundMoney(lineTotal / rawQty);
      } else if (lineTotal <= 0 && rawQty > 0 && unitPrice > 0) {
        const gross = rawQty * unitPrice;
        lineTotal = discountPercent > 0 ? roundMoney(gross * (1 - discountPercent / 100)) : roundMoney(gross);
      } else if (rawQty > 0 && unitPrice > 0 && lineTotal > 0 && discountPercent === 0) {
        // If no discount was found but lineTotal is exact multiple:
        const expectedGross = rawQty * unitPrice;
        if (Math.abs(expectedGross - lineTotal) > 1.5) {
          // Check if Qty was mistakenly set to 1 while lineTotal is clearly a multiple of unitPrice
          const calcQty = Math.round(lineTotal / unitPrice);
          if (rawQty === 1 && calcQty > 1 && Math.abs(calcQty * unitPrice - lineTotal) < 1) {
            rawQty = calcQty;
          }
        }
      }

      const finalQty = Math.max(1, rawQty);

      return createDraftLineItem(`gemini-ocr-${idx + 1}`, {
        itemCode: String(it.itemCode || idx + 1),
        medicine: medicineName,
        pack: String(it.pack || ''),
        qty: finalQty,
        bonusQty: Math.max(0, Number(it.bonusQty) || 0),
        purchasePrice: roundMoney(unitPrice),
        batchNo: batchNo || undefined,
        expiryDate: expiryDate || undefined,
      });
    });

    // Compute or extract totals
    const computedItemsSubtotal = roundMoney(items.reduce((sum: number, it: PurchaseLineItem) => sum + (it.qty * it.purchasePrice), 0));
    let extractedSubtotal = Number(parsedGemini.subtotal) || 0;
    if (extractedSubtotal <= 0 || Math.abs(extractedSubtotal - computedItemsSubtotal) > 200) {
      extractedSubtotal = computedItemsSubtotal;
    } else {
      extractedSubtotal = roundMoney(extractedSubtotal);
    }

    let extractedTax = roundMoney(Number(parsedGemini.taxAmount ?? parsedGemini.advanceTax ?? 0));
    let extractedTotal = Number(parsedGemini.totalAmount ?? parsedGemini.grandTotal ?? 0);

    if (extractedTotal > 0) {
      extractedTotal = roundMoney(extractedTotal);
      // If invoice total exceeds subtotal (due to Advance Tax u/s 236h, GST, etc.) and tax was incomplete:
      if (extractedTotal > extractedSubtotal && (extractedTax === 0 || Math.abs((extractedSubtotal + extractedTax) - extractedTotal) > 1)) {
        extractedTax = roundMoney(extractedTotal - extractedSubtotal);
      }
    } else {
      extractedTotal = roundMoney(extractedSubtotal + extractedTax);
    }

    const parsedOcr: ParsedPurchaseOcr = {
      rawText: rawContent,
      supplierName: parsedGemini.supplierName || 'Premier Sales (Private) Limited',
      orderNo: parsedGemini.orderNo || parsedGemini.invoiceReference || '',
      invoiceReference: parsedGemini.invoiceReference || parsedGemini.orderNo || '',
      orderDate: parsedGemini.orderDate || today,
      shipmentDate: parsedGemini.orderDate || today,
      expectedDate: parsedGemini.orderDate || today,
      paymentMethod,
      notes: parsedGemini.notes || '',
      subtotal: extractedSubtotal,
      taxAmount: extractedTax,
      totalAmount: extractedTotal,
      isBlurry,
      blurWarning,
      items,
      confidence: isBlurry ? 0.4 : 0.98,
      warnings,
      expiriesDetected,
      batchesDetected,
    };

    return NextResponse.json({
      success: true,
      source: 'gemini',
      parsed: parsedOcr,
    });
  } catch (error: any) {
    console.error('OCR Route Error:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'Failed to process invoice OCR.',
    }, { status: 500 });
  }
}
