const getInitials = (name: string) => {
	if (!name) return ''
	let split = name.trim().split(' ')
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

export { getInitials, generateUID }
