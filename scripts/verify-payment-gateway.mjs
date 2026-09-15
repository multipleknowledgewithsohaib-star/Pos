#!/usr/bin/env node
import {
  DEFAULT_GATEWAY_SETTINGS,
  processGatewayPayment,
} from '../lib/pos-payment-gateway.ts';

const gateway = structuredClone(DEFAULT_GATEWAY_SETTINGS);
const total = 1500;

const cases = [
  {
    name: 'Cash valid',
    input: { method: 'Cash', total, amountReceived: 2000, gateway },
    expectOk: true,
  },
  {
    name: 'Cash insufficient',
    input: { method: 'Cash', total, amountReceived: 1000, gateway },
    expectOk: false,
  },
  {
    name: 'Bank Transfer valid',
    input: { method: 'Bank Transfer', total, amountReceived: total, bankReference: 'TRX-123', gateway },
    expectOk: true,
  },
  {
    name: 'Bank Transfer missing ref',
    input: { method: 'Bank Transfer', total, amountReceived: total, gateway },
    expectOk: false,
  },
  {
    name: 'Card valid',
    input: { method: 'Card', total, amountReceived: total, cardReference: 'AUTH-88', gateway },
    expectOk: true,
  },
  {
    name: 'JazzCash valid',
    input: { method: 'JazzCash', total, amountReceived: total, payerMobile: '03001234567', gateway },
    expectOk: true,
  },
  {
    name: 'EasyPaisa valid',
    input: { method: 'EasyPaisa', total, amountReceived: total, payerMobile: '03007654321', gateway },
    expectOk: true,
  },
  {
    name: 'JazzCash disabled',
    input: {
      method: 'JazzCash',
      total,
      amountReceived: total,
      payerMobile: '03001234567',
      gateway: { ...gateway, jazzCash: { ...gateway.jazzCash, enabled: false } },
    },
    expectOk: false,
  },
];

let failed = 0;

for (const testCase of cases) {
  const result = processGatewayPayment(testCase.input);
  const pass = result.ok === testCase.expectOk;

  if (!pass) {
    failed += 1;
    console.error(`FAIL: ${testCase.name} -> expected ok=${testCase.expectOk}, got ok=${result.ok}`);
    continue;
  }

  console.log(`PASS: ${testCase.name}`);
}

if (failed > 0) {
  process.exit(1);
}

console.log('\nAll payment gateway checks passed.');
