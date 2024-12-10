import got from 'got'
import {CookieJar} from 'tough-cookie'
import { Event } from './event.js'
import { Agenda, AgendaItem, AgendaLivePosition, Song } from './agenda.js'


export class ChurchtoolsApi {
    constructor(instanceUrl, userId, token, logger) {
        this.instanceUrl = instanceUrl
        this.userId = userId
        this.token = token
        this.logger = logger
        this.cookieJar = new CookieJar()
        this.csrfToken = ""
    }
    
    async sendRequest(moduleName, functionName, params={}) {
        /**
         * Send a request to the old ChurchTools API
         * 
         * Args:
         *     moduleName (str): The ChurchTools module to reference
         *     functionName (str): The function in the module to call
         *     params (object, optional): Key value pairs to pass to the function as parameters. Defaults to {}.
         * 
         * Returns:
         *     object|bool: The parsed json response or false on failure
         * 
         * @TODO: Implement logging
        **/
        var requestUrl = this.instanceUrl + "?q=" + moduleName.toLowerCase() + "/ajax"
        params["func"] = functionName.toLowerCase()
        var response = await this.getJson(requestUrl, params)

        if (!("status" in response) || response["status"] != "success") return false
        else return response
    }

    async getJson(requestUrl, params={}, methodName="POST") {
        /**
         * Request a json response
         * 
         * Args:
         *     requestUrl (str): The url to send the request to
         *     params (dict, optional): The data to send with the request. Defaults to {}.
         *     methodName (str, optional): Request method. Defaults to "POST".
         * 
         * Returns:
         *     dict: The parsed json response
        **/
        var headers = {}
        // Set csrf header
        if ("" != this.csrfToken) headers["CSRF-Token"] = this.csrfToken
        // Set content type
        if ("GET" == methodName) headers["Content-type"] = "application/x-www-form-urlencoded"
        else headers["Content-type"] = "application/json; charset=UTF-8"

        var options = {
            headers: headers,
            cookieJar: this.cookieJar,
            method: methodName
        }
        if ("GET" == methodName) options["searchParams"] = params
        else options["json"] = params

        // Do request
        var response = await got(requestUrl, options).json()
        return response
    }

    async sendRestRequest(path, type="POST", params={}) {
        /**
         * Send a request to the ChurchTools REST API
         * 
         * Args:
         *     path (str): The API path
         *     type (str, optional): Request type. Defaults to "POST".
         *     params (dict, optional): Additional parameters. Defaults to {}.
         * 
         * Returns:
         *     dict|bool: The parsed response or false on failure
         * 
         * @TODO: Implement logging
        **/
        var requestUrl = this.instanceUrl + "api" + path
        var response = await this.getJson(requestUrl, params, type)
        return response
    }

    async login() {
        /**
         * Login to the API
         * 
         * Throws:
         *     LoginFailure: Login failed
        **/
        this.logger.log("info", "Logging in")
        var response = await this.sendRequest("login", "loginWithToken", {id: this.userId, token: this.token})
        if (false == response) throw "LoginFailure"

        await this.getCsrfToken()
        this.logger.log("info", "Login successful")
    }

    async logout() {
        /**
         * Logout from the API
         * 
         * Throws:
         *     LoginFailure: Logout failed
        **/
        this.logger.log("info", "Logging out")
        var response = await this.sendRequest("login", "logout", {id: this.userId, token: this.token})
        if (false == response) throw "LogoutFailure"
        this.logger.log("info", "Logout successful")
    }

    async getCsrfToken() {
        /**
         * Get a CSRF token to validate future requests
        **/
        var response = await this.sendRestRequest("/csrftoken", "GET")
        this.csrfToken = response["data"]
    }

    async getUpcomingEvents(latestStart) {
        /**
         * Load all upcoming events
         * 
         * Args:
         *     latestStart (Date): Only get events that start before this time
         * 
         * Returns:
         *     list[Event]: A list of all upcoming events
        **/
        // Collect all data
        var response = await this.sendRequest('ChurchService', 'getAllEventData')

        var eventDataList = response['data']
        // Build the events
        var eventList = []

        for (const [_, eventData] of Object.entries(eventDataList)) {
            // Only keep upcoming events
            if (new Date(eventData["enddate"]) < latestStart) continue
            eventList.push(new Event(eventData))
        }
        return eventList
    }

    async getLatestEvent() {
        /**
         * Get the latest event
         * 
         * Returns:
         *     Event: Latest event
        **/
        var eventList = await this.getUpcomingEvents(new Date())
        var eventsWithAgendaList = []
        
        eventList.forEach(event => {
            if (event.hasAgenda()) eventsWithAgendaList.push(event)
        });
        var minEvent = eventsWithAgendaList.reduce((previous, current) => previous.endtimestamp < current.endtimestamp ? previous : current)
        return minEvent
    }

    async getEventAgendaBase(event) {
        /**
         * Get an events agenda with only it's base data (no items or songs)
         * 
         * Args:
         *     event (Event): The event to get the agenda of
         * 
         * Returns:
         *     Agenda: The events agenda
        **/
        var response = await this.sendRequest('ChurchService', 'loadAgendaForEvent', {event_id: event.id})
        return new Agenda(response["data"])
    }

    async getAllSongs() {
        /**
         * Get all existing songs
         * 
         * Returns:
         *     list[Song]: All existing songs
         */
        var response = await this.sendRequest('ChurchService', 'getAllSongs', {})
        var songList = []
        for (const [_, songData] of Object.entries(response["data"]["songs"])) {
            songList.push(new Song(songData))
        }
        return songList
    }

    async getAllSongArrangements() {
        /**
         * Get all existing song arrangements
         * 
         * Returns:
         *     dict[id, SongArrangement]: All existing song arrangements
         */
        var songList = await this.getAllSongs()
        var songArrangements = {}
        songList.forEach(song => {
            song.arrangementList.forEach(arrangement => {
                songArrangements[arrangement.id] = arrangement
            })
        })
        return songArrangements
    }

    async _agendaItemsAddSongs(agenda) {
        /**
         * Add songs to all agenda song items
         * 
         * Args:
         *     agenda (Agenda): Agenda to add the songs to
         */
        var songArrangementList = await this.getAllSongArrangements()
        var agendaSongItemList = await agenda.getAllSongItems()
        agendaSongItemList.forEach(songItem => {
            if (songItem.arrangementId in songArrangementList) {
                songItem.addSongArrangement(songArrangementList[songItem.arrangementId])
            }
        })
    }

    async agendaAddItems(agenda) {
        /**
         * Add all items to an agenda
         * 
         * Args:
         *     agenda (Agenda): Agenda to add items to
        **/
        var response = await this.sendRequest('ChurchService', 'loadAgendaItems', {agenda_id: agenda.id})
        for (const [_, itemData] of Object.entries(response["data"])) {
            //TODO: add song(title)s via "arrangement_id" property of AgendaItem => all songs can be fetch via "getAllSongs" ajax function (no other parameters needed, but maybe try arrangement_id)
            var item = new AgendaItem(itemData)
            agenda.addItem(item)
        }

        await this._agendaItemsAddSongs(agenda)
    }


    async getEventAgenda(event) {
        /**
         * Get an events agenda
         * 
         * Args:
         *     event (Event): The event to get the agenda of
         * 
         * Returns:
         *     Agenda: The events agenda
        **/
        var agenda = await this.getEventAgendaBase(event)
        await this.agendaAddItems(agenda)
        return agenda
    }

    async getAgendaLivePosition(event, agenda) {
        /**
         * Get the agendas current live position
         * 
         * Args:
         *     event (Event): The event the agenda belongs to
         *     agenda (Agenda): The agenda to get the position of
         * 
         * Returns:
         *     AgendaLivePosition: Position id and seconds added to position time
        **/
        var response = await this.sendRequest('ChurchService', 'loadAgendaLivePosition', {event_id: event.id, agenda_id: agenda.id})
        return new AgendaLivePosition(response["data"], agenda)
    }

    async agendaLivePositionAdvance(event, agenda) {
        /**
         * Advace the agendas live position by one
         * 
         * Args:
         *     event (Event): The event the agenda belongs to
         *     agenda (Agenda): The agenda to advance
         * 
         * Returns:
         *     AgendaLivePosition: New agenda live position
        **/
        this.logger.log("info", "Advancing live agenda position")
        var currentPosition = await this.getAgendaLivePosition(event, agenda)
        var nextPosition = currentPosition.getNextItem()
        if (null == nextPosition) return
        var nextPositionId = agenda.getPositionIdFromItemSortkey(nextPosition.sortkey)
        await this.sendRequest('ChurchService', 'saveAgendaLivePosition', {event_id: event.id, pos_id: nextPositionId, addseconds: 0})
        return AgendaLivePosition.getLiveAgendaPosition(agenda, nextPositionId)
    }

    async agendaLivePositionReverse(event, agenda) {
        /**
         * Reverse the agendas live position by one
         * 
         * Args:
         *     event (Event): The event the agenda belongs to
         *     agenda (Agenda): The agenda to reverse
        **/
        this.logger.log("info", "Reversing live agenda position")
        var currentPosition = await this.getAgendaLivePosition(event, agenda)
        var previousPosition = currentPosition.getPreviousItem()
        if (null == previousPosition) return
        var previousPositionId = agenda.getPositionIdFromItemSortkey(previousPosition.sortkey)
        await this.sendRequest('ChurchService', 'saveAgendaLivePosition', {event_id: event.id, pos_id: previousPositionId, addseconds: 0})
        return AgendaLivePosition.getLiveAgendaPosition(agenda, previousPositionId)
    }

    async agendaLivePositionAddTime(event, agenda, secondsToAdd=60) {
        /**
         * Add time to the current live aganda item
         * 
         * Args:
         *     event (Event): The event the agenda belongs to
         *     agenda (Agenda): The agenda to add time to the current live item
         *     secondsToAdd (int, optional): Time in seconds to add to the item. Defaults to 60.
        **/
        this.logger.log("info", "Adding " + secondsToAdd + " seconds to current live agenda item")
        var currentPosition = await this.getAgendaLivePosition(event, agenda)
        await this.sendRequest('ChurchService', 'saveAgendaLivePosition', {event_id: event.id, pos_id: currentPosition.positionId, addseconds: currentPosition.secondsToAdd + secondsToAdd})
    }

    async agendaLivePositionReduceTime(event, agenda, secondsToReduce=60) {
        /**
         * Reduce time to the current live aganda item
         * 
         * Args:
         *     event (Event): The event the agenda belongs to
         *     agenda (Agenda): The agenda to reduce time of the current live item
         *     secondsToReduce (int, optional): Time in seconds to reduce from the item. Defaults to 60.
        **/
        this.logger.log("info", "Reducing current live agenda item by " + secondsToReduce + " seconds")
        var currentPosition = await this.getAgendaLivePosition(event, agenda)
        await this.sendRequest('ChurchService', 'saveAgendaLivePosition', {event_id: event.id, pos_id: currentPosition.positionId, addseconds: currentPosition.secondsToAdd - secondsToReduce})
    }
}
