import { InstanceBase, runEntrypoint, InstanceStatus } from '@companion-module/base'
import { configFields } from './config.js'
import { upgradeScripts } from './upgrade.js'
import { ChurchtoolsApi } from './churchtoolsApi.js'
import { UpdateActions } from './actions.js'


class Churchtools extends InstanceBase {
	constructor(internal) {
		super(internal)
		this._event = null
		this._agenda = null
	}

	async configUpdated(config) {
		this._api.logout()
		this._config = config
		this._api = new ChurchtoolsApi(this._config.instanceUrl, this._config.userId, this._config.token, this)
		await this._api.login()
		await this.reloadNextEvent()

		this.updateActions()
	}

	async init(config) {
		this._config = config
		this._api = new ChurchtoolsApi(this._config.instanceUrl, this._config.userId, this._config.token, this)
		await this._api.login()
		await this.reloadNextEvent()

		this.updateStatus(InstanceStatus.Ok)

		this.updateActions()
	}


	// Return config fields for web config
	getConfigFields() {
		return configFields
	}

	// When module gets deleted
	async destroy() {
		await this._api.logout()
	}

	updateFeedbacks() {}

	updateVariableDefinitions() {}

	updateActions() {
		UpdateActions(this)
	}

	async reloadNextEvent() {
		this.log("info", "Reloading next event")
		this._event = await this._api.getLatestEvent()
    	this._agenda = await this._api.getEventAgenda(this._event)
		this.log("info", "Selected event \"" + this._agenda.name + "\"(ID: " + this._agenda.id + ") as next event")
	}

	_eventSelectedWarning() {
		if (null == this._event || null == this._agenda) {
			this.log("warn", "Next event not selected automatically yet, try again later or reload manually with action \"Reload Next Event\"")
			return true
		}
		return false
	}

	async nextAgendaItem() {
		if (this._eventSelectedWarning()) return
		await this._api.agendaLivePositionAdvance(this._event, this._agenda)
	}
	async previousAgendaItem() {
		if (this._eventSelectedWarning()) return
		await this._api.agendaLivePositionReverse(this._event, this._agenda)
	}
	async agendaItemAddTime(secondsToAdd) {
		if (this._eventSelectedWarning()) return
		await this._api.agendaLivePositionAddTime(this._event, this._agenda, secondsToAdd)
	}
	async agendaItemReduceTime(secondsToReduce) {
		if (this._eventSelectedWarning()) return
		await this._api.agendaLivePositionReduceTime(this._event, this._agenda, secondsToReduce)
	}
}

runEntrypoint(Churchtools, upgradeScripts)
