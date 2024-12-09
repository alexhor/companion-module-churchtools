export class AgendaItem {
    get id() {
        /**
         * Id of the agenda item
         * 
         * Returns:
         *     int: Id of the agenda item
        **/
        return Number(this._data["id"])
    }

    get sortkey() {
        /**
         * Key to sort the agenda item by
         * 
         * Returns:
         *     int: Key to sort the agenda item by
        **/
        return Number(this._data["sortkey"])
    }
    
    get name() {
        /**
         * Name of the agenda item
         * 
         * Returns:
         *     str: Name of the agenda item
        **/
        return this._data["bezeichnung"]
    }

    isHeader() {
        /**
         * Wether this item is a header
         * 
         * Returns:
         *     bool: Wether this item is a header
        **/
        if ('1' == this._data["header_yn"]) return true
        else return false
    }

    constructor(data) {
        this._data = data
    }
    
    static startItem() {
        /**
         * Get an item that represents the start of an agenda
         * 
         * Returns:
         *     AgendaItem: The agenda item
        **/
        return AgendaItem({id: -1, sortkey: -1, header_yn: "0", bezeichnung: "-- Not started yet --"})
    }
    
    static endItem() {
        /**
         * Get an item that represents the end of an agenda
         * 
         * Returns:
         *     AgendaItem: The agenda item
        **/
        return AgendaItem({id: -2, sortkey: -2, header_yn: "0", bezeichnung: "-- End --"})
    }
}

export class AgendaLivePosition {
    get positionId() {
        /**
         * Get the position id of the current item
         * 
         * Returns:
         *     int: Current item position id
        **/
        if (null == this._data["pos_id"]) return 0
        else return Number(this._data["pos_id"])
    }

    get secondsToAdd() {
        /**
         * Seconds to add to the normal duration of the current live agenda item
         * 
         * Returns:
         *     int: Seconds to add
        **/
        if (null == this._data["addseconds"]) return 0
        return Number(this._data["addseconds"])
    }

    constructor(data, agenda) {
        this._data = data
        this._agenda = agenda
    }
    
    getCurrentItem() {
        /**
         * Get the current live agenda item
         * 
         * Returns:
         *     AgendaItem: Current live agenda item
        **/
        if (0 == this.positionId)
            return AgendaItem.startItem()
        else if (this._agenda.getItemsLen() < this.positionId)
            return AgendaItem.endItem()
        else
            return this._agenda.getItemAtPosition(this.positionId)
    }

    getNextItem() {
        /**
         * Get the next live agenda item
         * 
         * Returns:
         *     AgendaItem|None: Next live agenda item or None if the current one is the last one
        **/
        if (this._agenda.getItemsLen() < this.positionId)
            return None
        else if (this._agenda.getItemsLen() == this.positionId)
            return AgendaItem.endItem()
        else
            return this._agenda.getItemAtPosition(this.positionId + 1)
    }
}

export class Agenda {
    get id() {
        /**
         * Id of the agenda item
         * 
         * Returns:
         *     int: Id of the agenda item
        **/
        return this._data["id"]
    }

    get name() {
        /**
         * Name of the agenda
         * 
         * Returns:
         *     str: Name of the agenda
        **/
        return this._data["bezeichnung"]
    }

    constructor(data) {
        this._data = data
        this._items = {}
    }

    addItem(item) {
        /**
         * Add an agenda item
         * 
         * Args:
         *     item (Item): Agenda item to add
        **/
        if (item.isHeader()) return
        this._items[item.sortkey] = item
    }
    
    addItemList(itemList) {
        /**
         * Add a list of agenda items
         * 
         * Args:
         *     itemList (list[Item]): List of agenda items to add
        **/
        itemList.forEach(item => {
            this.addItem(item)
        });
    }

    getItemsLen() {
        /**
         * Get the number of items in this agenda
         * 
         * Returns:
         *     int: Number of items
        **/
        return Object.keys(this._items).length
    }

    getItemAtPosition(positionId) {
        /**
         * Get the item at the given agenda position
         * 
         * Args:
         *     positionId (int): The position to get the item at
         * 
         * Returns:
         *     AgendaItem: The item at the given position
        **/
        var itemKeys = Object.keys(this._items).sort()
        var keyAtPosition = itemLeys[positionId - 1]
        return self._items[keyAtPosition]
    }
}
