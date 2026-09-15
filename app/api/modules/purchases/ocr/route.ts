import { NextResponse } from 'next/server';
import { sampleInvoices } from '@/lib/sample-invoices';
import { createDraftLineItem, type PurchasePaymentMethod } from '@/lib/purchase-data';
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
    const key = apiKey || process.env.GEMINI_API_KEY || (process.env.OCR_API_KEY?.startsWith('AIza') ? process.env.OCR_API_KEY : '');

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
      'gemini-2.5-flash-lite',
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-3.5-flash',
    ];

    const prompt = `You are an expert pharmaceutical invoice parser AI.
Analyze this pharmacy invoice/bill image carefully and extract all structured data into a pure JSON object.
Return ONLY valid JSON with this exact schema (no markdown, no backticks):
{
  "supplierName": "Full distributor/supplier company name (e.g. Premier Sales (Private) Limited)",
  "orderNo": "Invoice / Bill number (e.g. 460270 or 612832)",
  "invoiceReference": "Supply ID / Ref number if present (e.g. 2025-68303-460270-1)",
  "orderDate": "YYYY-MM-DD (e.g. 2025-12-16 or 2026-02-10)",
  "paymentMethod": "Cash" | "Credit" | "Bank Transfer" | "Card",
  "notes": "Manufacturer name or remarks (e.g. PHARMEVO (PVT) LIMITED or HIGHNOON)",
  "items": [
    {
      "itemCode": "item code (e.g. 13543)",
      "medicine": "Clean medicine name (e.g. ANPLAG 90MG TAB CP)",
      "pack": "pack size if mentioned (e.g. 10S, 14S, TAB, CAP)",
      "qty": 3,
      "bonusQty": 0,
      "purchasePrice": 1445.00,
      "batchNo": "Batch number only (e.g. 5L022 or 252144)",
      "expiryDate": "YYYY-MM-DD format (convert month-year like 9-27 or 09/27 or 6-27 to 2027-09-30, use last day of that month)"
    }
  ]
}
Special Instructions for Pakistani Pharma Invoices:
1. "Batch/Expiry" column usually contains format like "<Batch> /<Month>-<YY>" (e.g. "5L022 /9-27" means Batch: "5L022", Expiry: "2027-09-30").
2. "TP" column is the Trade Price / purchasePrice.
3. Extract EVERY product row listed in the table without skipping any.`;

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
      },
    };

    let rawContent = '';
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        });

        if (response.ok) {
          const data = await response.json();
          rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawContent) break;
        } else {
          const err = await response.text();
          lastError = `${model} (${response.status}): ${err.slice(0, 150)}`;
        }
      } catch (e: any) {
        lastError = e?.message || 'Network error';
      }
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

      // Clean medicine name (remove leading * or numbers)
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

      return createDraftLineItem(`gemini-ocr-${idx + 1}`, {
        itemCode: String(it.itemCode || ''),
        medicine: medicineName,
        pack: String(it.pack || ''),
        qty: Math.max(1, Number(it.qty) || 1),
        bonusQty: Math.max(0, Number(it.bonusQty) || 0),
        purchasePrice: Math.max(0, Number(it.purchasePrice) || 0),
        batchNo: batchNo || undefined,
        expiryDate: expiryDate || undefined,
      });
    });

    const parsedOcr: ParsedPurchaseOcr = {
      rawText: rawContent,
      supplierName: parsedGemini.supplierName || 'Premier Sales (Private) Limited',
      orderNo: parsedGemini.orderNo || '',
      invoiceReference: parsedGemini.invoiceReference || parsedGemini.orderNo || '',
      orderDate: parsedGemini.orderDate || today,
      shipmentDate: parsedGemini.orderDate || today,
      expectedDate: parsedGemini.orderDate || today,
      paymentMethod,
      notes: parsedGemini.notes || '',
      items,
      confidence: 0.98,
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
