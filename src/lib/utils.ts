const getInitials = (name: string) => {
	if (!name) return ''
	const split = name.trim().split(' ')
	if (split.length > 1) {
		const first = split[0]
		const last = split[split.length - 1]
		return `${first[0]}${last[0]}`.toUpperCase()
	}
	return name[0].toUpperCase()
}

const generateUID = () => {
	return crypto.getRandomValues(new Uint32Array(1))[0] % 1000000
}

// Generates a random channel name xxx-xxx-xxx
const generateChannelName = () =>
	crypto
		.randomUUID()
		.slice(1, -1)
		.slice(-9)
		.match(/.{1,3}/g)!
		.join('-')

// Check if the channel name is valid
const validateChannelName = (channel: string) =>
	/^[0-9a-f-]+$/.test(channel) && channel.length === 11

export { getInitials, generateUID, generateChannelName, validateChannelName }
