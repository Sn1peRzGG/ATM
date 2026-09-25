import chalk from 'chalk'
import promptSync from 'prompt-sync'
import { findCard, verifyPin, withdraw } from './atm'

const prompt = promptSync({ sigint: true })

while (true) {
	const cardNumber = prompt('Card number (or "exit"): ')?.trim()

	if (!cardNumber) continue
	if (cardNumber.toLowerCase() === 'exit') break

	const card = findCard(cardNumber)

	if (!card) {
		console.log(chalk.red('Card not found'))
		continue
	}

	if (card.isBlocked) {
		console.log(chalk.red('Card is blocked'))
		continue
	}

	let authenticated = false

	while (card.failedPinAttempts < 3) {
		const pin = prompt('PIN (or "cancel"): ')?.trim()

		if (pin?.toLowerCase() === 'cancel') break

		if (pin && verifyPin(card, pin)) {
			authenticated = true
			break
		}

		if (card.isBlocked) {
			console.log(chalk.red('Card blocked! Max attempts exceeded'))
			break
		}

		console.log(
			chalk.yellow(`Wrong PIN. Attempts left: ${3 - card.failedPinAttempts}`),
		)
	}

	if (!authenticated) continue

	console.log(chalk.green(`\nAuthenticated. Hello, ${card.ownerName}`))

	let session = true
	while (session) {
		console.log('\n1. Balance\n2. Withdraw\n3. Exit')
		const action = prompt('> ')?.trim()

		switch (action) {
			case '1':
				console.log(chalk.blue(`Balance: $${card.balance}`))
				break

			case '2': {
				const input = prompt('Amount (or "cancel"): ')?.trim()
				if (input?.toLowerCase() === 'cancel') break

				if (!input || !/^\d+$/.test(input)) {
					console.log(chalk.red('Invalid integer amount'))
					break
				}

				try {
					const dispensed = withdraw(card, Number(input))
					console.log(chalk.green('Dispensed:'))
					for (const b of dispensed) {
						console.log(`- $${b.value} x ${b.quantity}`)
					}
					console.log(chalk.blue(`New balance: $${card.balance}`))
				} catch (err) {
					const msg = err instanceof Error ? err.message : 'Transaction failed'
					console.log(chalk.red(`Error: ${msg}`))
				}
				break
			}

			case '3':
				session = false
				console.log(chalk.cyan('Card ejected'))
				continue

			default:
				console.log(chalk.red('Invalid option'))
				continue
		}

		console.log('\n1. Another operation\n2. Exit')
		const next = prompt('> ')?.trim()

		if (next !== '1') {
			session = false
			console.log(chalk.cyan('Card ejected'))
		} else {
			console.log(chalk.yellow('Re-authentication required'))
			session = false
		}
	}
}
