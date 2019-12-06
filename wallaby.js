module.exports = function (w) {
	return {
		files: [
			'packages/**/*.ts',
			{ pattern: 'packages/**/*.test.ts', ignore: true },
			{ pattern: 'packages/**/node_modules', ignore: true }
		],
		tests: [
			'packages/**/*.test.ts'
		],
		env: {
			type: 'node'
		},
		compilers: {
			'**/*.ts?(x)': w.compilers.typeScript({
				typescript: require('typescript')
			})
		},
		testFramework: 'jasmine'
	};
};
