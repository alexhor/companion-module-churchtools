import { InstanceBase, runEntrypoint, InstanceStatus } from '@companion-module/base'
import { configFields } from './config.js'
import { upgradeScripts } from './upgrade.js'
import { ChurchtoolsApi } from './churchtoolsApi.js'
import { UpdateActions } from './actions.js'
import { UpdateVariables } from './variables.js'
import { AgendaLivePosition } from './agenda.js'


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

		this.updateVariableDefinitions()
		this.updateActions()
	}

	async init(config) {
		this._currentLivePosition = null
		this._config = config

		this.updateVariableDefinitions()
		this.updateActions()

		this._api = new ChurchtoolsApi(this._config.instanceUrl, this._config.userId, this._config.token, this)
		await this._api.login()
		await this.reloadNextEvent()

		this.__updateAgendaTimesTimeout = setInterval(this.updateAgendaTimes.bind(this), 1000)

		this.updateStatus(InstanceStatus.Ok)

	}


	// Return config fields for web config
	getConfigFields() {
		return configFields
	}

	// When module gets deleted
	async destroy() {
		clearTimeout(this.__updateAgendaTimesTimeout)
		await this._api.logout()
	}

	updateFeedbacks() {}

	updateVariableDefinitions() {
		UpdateVariables(this)
	}

	updateActions() {
		UpdateActions(this)
	}

	async _getAgendaLivePositionVariables() {
		/**
		 * Get the variable values for the agenda live positions
		 * 
		 * Returns:
		 *     object: Values for the agenda live positions variables
		 */
		this._currentLivePosition = await this._api.getAgendaLivePosition(this._event, this._agenda)

		// Get items
		var previousItemName = this._currentLivePosition.getPreviousItem()
		previousItemName = null == previousItemName ? "" : previousItemName.name
		var currentItemName = this._currentLivePosition.getCurrentItem()
		currentItemName = null == currentItemName ? "" : currentItemName.name
		var nextItemName = this._currentLivePosition.getNextItem()
		nextItemName = null == nextItemName ? "" : nextItemName.name
		
		return {
			previousAgendaItemName: previousItemName,
			currentAgendaItemName: currentItemName,
			nextAgendaItemName: nextItemName,
		}
	}

	async reloadNextEvent() {
		this.log("info", "Reloading next event")
		this._event = await this._api.getLatestEvent()
    	this._agenda = await this._api.getEventAgenda(this._event)
		this.log("info", "Selected event \"" + this._agenda.name + "\"(ID: " + this._agenda.id + ") as next event")

		var variables = await this._getAgendaLivePositionVariables()
		variables.selectedEventName = this._event.name
		variables.selectedEventId = this._event.id
		this.setVariableValues(variables)
	}

	_eventSelectedWarning(logWarning=true) {
		if (null == this._event || null == this._agenda) {
			if (logWarning) this.log("warn", "Next event not selected automatically yet, try again later or reload manually with action \"Reload Next Event\"")
			return true
		}
		return false
	}

	async nextAgendaItem() {
		if (this._eventSelectedWarning()) return
		await this._api.agendaLivePositionAdvance(this._event, this._agenda)
		var variables = await this._getAgendaLivePositionVariables()
		this.setVariableValues(variables)
	}

	async previousAgendaItem() {
		if (this._eventSelectedWarning()) return
		await this._api.agendaLivePositionReverse(this._event, this._agenda)
		var variables = await this._getAgendaLivePositionVariables()
		this.setVariableValues(variables)
	}
	
	async agendaItemAddTime(secondsToAdd) {
		if (this._eventSelectedWarning()) return
		await this._api.agendaLivePositionAddTime(this._event, this._agenda, secondsToAdd)
		var variables = await this._getAgendaLivePositionVariables()
		this.setVariableValues(variables)
	}

	async agendaItemReduceTime(secondsToReduce) {
		if (this._eventSelectedWarning()) return
		await this._api.agendaLivePositionReduceTime(this._event, this._agenda, secondsToReduce)
		var variables = await this._getAgendaLivePositionVariables()
		this.setVariableValues(variables)
	}

	updateAgendaTimes() {
		/**
		 * Update the agenda time variables
		 */
		if (null == this._currentLivePosition) return
		// Calc time
		var now = new Date()
		var endTime = this._currentLivePosition.getEndTime()
		var endTimestamp = Math.floor(endTime.getTime() / 1000)

		var totalSecondsLeft = Math.floor(endTime.getTime() / 1000 - now.getTime() / 1000)
		var minutesLeft = totalSecondsLeft > 0 ? Math.floor(totalSecondsLeft / 60) : 0
		var secondsLeft = totalSecondsLeft > 0 ? totalSecondsLeft % 60 : 0
		// Pad time
		minutesLeft = (minutesLeft + "").padStart(2, "0")
		secondsLeft = (secondsLeft + "").padStart(2, "0")
		// Set variables
		this.setVariableValues({
			currentAgendaItemMinutesLeft: minutesLeft,
			currentAgendaItemSecondsLeft: secondsLeft,
			currentAgendaItemTimeLeft: minutesLeft + ":" + secondsLeft,
			currentAgendaItemEndTimestamp: endTimestamp,
		})
	}
}

runEntrypoint(Churchtools, upgradeScripts)
