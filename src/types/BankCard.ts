export type BankCard = {
	cardNumber: string
	pin: string
	balance: number
	isBlocked: boolean
	failedPinAttempts: number
	ownerName: string
}
