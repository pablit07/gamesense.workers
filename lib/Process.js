var fs = require('fs')

class Process {

	constructor(name, instances, pm2) {

		let path = 'workers/' + name + '.js'
		if (!fs.existsSync(path)) throw new Exception()

		this.name = name
		this.pm2 = pm2
		this.options = {instances: instances}
	}

	start() {
		return new Promise(resolve => {

			this.pm2.connect((err) => {
		  		if (err) {
		  			console.error(err)
		  			this.pm2.disconnect()
		  			// resolve()
		  			throw new Exception()
		  		}

		  		let base = {
		  			script: 'startWorker.js',
		  			name: this.name,
		  			args: this.name,	
		  			exec_mode : this.options.instances == 1 ? 'fork' : 'cluster'
		  		},
		  			options = Object.assign(base, this.options)

				this.pm2.start(options, (err, apps) => { this.pm2.disconnect(); resolve() } )
			})
		})
	}
}

module.exports = Process