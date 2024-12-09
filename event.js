export class Event {
    get endtimestamp() {
        /**
         * Return unix timestamp of event end time
         * 
         * Returns:
         *     float: end time unix timestamp
        **/
        return new Date(this._data["enddate"]).getTime()
    }

    get name() {
        /**
         * Name of the event
         * 
         * Returns:
         *     str: Name of the event
        **/
        return this._data["bezeichnung"]
    }
    
    get id() {
        /**
         * Id of the event
         * 
         * Returns:
         *     int: Id of the event
        **/
        return this._data["id"]
    }
    
    hasAgenda() {
        /**
         * Wether this event has an agenda
         * 
         * Returns:
         *     bool: Wether this event has an agenda
        **/
        if ("agenda" in this._data && this._data["agenda"]) return true
        else if ("agenda_id" in this._data && null != this._data["agenda_id"]) return true
        else return false
    }

    constructor(eventData) {
        this._data = eventData
    }
}
