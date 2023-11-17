import { describe } from 'mocha'
import { genData, splitToWords } from '../src/utils'
import path from 'path'
import { buildPoseidon } from 'circomlibjs'

import assert from 'assert'

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-var-requires
const wasm_tester = require('circom_tester/wasm/tester')

describe('PCD tests', function () {
  this.timeout(0)

  let testData: [bigint, bigint, bigint, bigint]

  this.beforeEach(async () => {
    testData = await genData('Hello world', 'SHA-1')
  })

  it('Nullifier workflow', async function () {
    const client_hasher = await wasm_tester(
      path.join(__dirname, 'circuits/hash_test.circom')
    )

    const app_id = BigInt(1234555) // random value.

    const input = {
      signature: splitToWords(testData[1], BigInt(64), BigInt(32)),
      modulus: splitToWords(testData[2], BigInt(64), BigInt(32)),
      base_message: splitToWords(testData[3], BigInt(64), BigInt(32)),
      app_id: BigInt(1234555).toString(),
    }

    const client_outputs = await client_hasher.calculateWitness(input)

    const nullifier = client_outputs[1]

    console.log(client_outputs[1])
    console.log(client_outputs[2])

    const poseidon = await buildPoseidon()

    const compute_nullifier = poseidon([testData[3], app_id])

    assert(nullifier == poseidon.F.toString(compute_nullifier))
  })
})
