import { cards } from './data/bankCards'
import { BankCard } from './types/BankCard'
import { BanknoteType } from './types/BanknoteType'

const MAX_PIN_ATTEMPTS = 3
const MAX_DISPENSE_BILLS = 30
const DENOMINATIONS = [1000, 500, 200, 100] as const

const vault: BanknoteType[] = DENOMINATIONS.map(value => ({
	value,
	quantity: Math.floor(Math.random() * 101),
}))

export const findCard = (cardNumber: string): BankCard | undefined => {
	return cards.find(c => c.cardNumber === cardNumber)
}

export const verifyPin = (card: BankCard, inputPin: string): boolean => {
	if (card.isBlocked) return false

	if (card.pin === inputPin) {
		card.failedPinAttempts = 0
		return true
	}

	card.failedPinAttempts += 1
	if (card.failedPinAttempts >= MAX_PIN_ATTEMPTS) {
		card.isBlocked = true
	}

	return false
}

export const withdraw = (card: BankCard, amount: number): BanknoteType[] => {
	if (amount <= 0 || amount % 100 !== 0) {
		throw new Error('Amount must be positive and multiple of 100')
	}

	if (card.balance < amount) {
		throw new Error('Insufficient funds')
	}

	const result: BanknoteType[] = []
	let rest = amount
	let totalBills = 0

	for (const item of vault) {
		if (rest === 0) break

		const take = Math.min(
			Math.floor(rest / item.value),
			item.quantity,
			MAX_DISPENSE_BILLS - totalBills,
		)

		if (take > 0) {
			result.push({ value: item.value, quantity: take })
			rest -= take * item.value
			totalBills += take
		}
	}

	if (rest > 0 || totalBills > MAX_DISPENSE_BILLS) {
		throw new Error(
			'Cannot dispense this amount (limit 30 bills or insufficient banknotes)',
		)
	}

	for (const dispensed of result) {
		const slot = vault.find(b => b.value === dispensed.value)
		if (slot) slot.quantity -= dispensed.quantity
	}

	card.balance -= amount
	return result
}
