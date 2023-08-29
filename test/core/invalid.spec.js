// npx mocha --no-exit test/core/invalid.spec.js
const { Testkit } = require('../../main')
const { Network } = Testkit()
const ObjectHash = require('ocore/object_hash')

describe('Check invalid units', function () {
	this.timeout(60000 * 1000)
	const timeout = async x => {
		return new Promise(
			resolve => { setTimeout(resolve, x * 1000) },
		)
	}

	before(async () => {
		// witness address: GM2YA62K6DWSJPI6GTMO22DPPYMOB6CL
		// genesis unit: A1N9KyyDdKq9vhUPVESmIwzrZMb3V+wKyMpOdbNO/QM=
		this.network = await Network.create({ mnemonic: 'mass work afraid spy traffic popular clinic grain child firm grass engage' })
			.with.explorer()
			.with.numberOfWitnesses(1)
			.run()
		this.genesis = await this.network.getGenesisNode().ready()
		this.hub = await this.network.getHub().ready()
		// Alice:  EIG3XRMMGUH6TUW7VZXRV7XVJWAR4J34
		this.alice = await this.network.newHeadlessWallet({ mnemonic: 'peace length ugly acquire fade boss accident river front visit cause example' }).ready()
	})

	it('Check invalid units', async () => {
		const aliceAddress = await this.alice.getAddress()

		const { unit: aliceInputUnit1 } = await this.genesis.sendBytes({ toAddress: aliceAddress, amount: 100000 })
		const { unit: aliceInputUnit2 } = await this.genesis.sendBytes({ toAddress: aliceAddress, amount: 100000 })

		// serial parents
		const { unit: aliceUnit1 } = await this.alice.composeJoint({
			opts: {
				inputs: [
					{
						message_index: 0,
						output_index: 0,
						unit: aliceInputUnit1,
					},
				],
				input_amount: 100000,
				outputs: [
					{ address: aliceAddress, amount: 0 },
				],
			},
			saveJoint: false,
			broadcastJoint: false,
		})
		aliceUnit1.parent_units = [aliceInputUnit1, aliceInputUnit2].sort()
		const { unit: aliceUnit1Fixed } = await this.alice.signUnit(aliceUnit1)
		aliceUnit1Fixed.unit = ObjectHash.getUnitHash(aliceUnit1Fixed)
		console.log(aliceUnit1Fixed.unit)
		this.hub.broadcastJoint({ unit: aliceUnit1Fixed })
		await timeout(0.5) // unit is discarded, nothing to wait for
		const { unitProps: aliceUnit1Props } = await this.alice.getUnitProps({ unit: aliceUnit1Fixed.unit })
		expect(aliceUnit1Props).to.be.empty
	}).timeout(30000 * 1000)

	after(async () => {
		// await this.network.stop()
	})
})
