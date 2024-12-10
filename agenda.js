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
        if (this.isSong() && null != this._songArrangement) {
            return this._songArrangement.song.name
        }
        else return this._data["bezeichnung"]
    }
    
    get arrangementId() {
        /**
         * Arrangement id of the agenda item
         * 
         * Returns:
         *     int: Arrangement id of the agenda item
        **/
        if (null == this._data["arrangement_id"]) return null
        else return Number(this._data["arrangement_id"])
    }

    isHeader() {
        /**
         * Wether this item is a header
         * 
         * Returns:
         *     bool: Wether this item is a header
        **/
        return '1' == this._data["header_yn"]
    }

    isSong() {
        /**
         * Wether this item is a song
         * 
         * Returns:
         *     bool: Wether this item is a song
        **/
        return (null != this.arrangementId && 0 != this.arrangementId)
    }

    constructor(data) {
        this._data = data
        this._songArrangement = null
    }

    addSongArrangement(songArrangement) {
        /**
         * Add a song arrangement to this item
         * 
         * Args:
         *     songArrangement[SongArrangement]: Song arrangement to add
         */
        if (!this.isSong()) return
        this._songArrangement = songArrangement
    }
    
    static startItem() {
        /**
         * Get an item that represents the start of an agenda
         * 
         * Returns:
         *     AgendaItem: The agenda item
        **/
        return new AgendaItem({id: -1, sortkey: -1, header_yn: "0", bezeichnung: "-- Not started yet --"})
    }
    
    static endItem() {
        /**
         * Get an item that represents the end of an agenda
         * 
         * Returns:
         *     AgendaItem: The agenda item
        **/
        return new AgendaItem({id: -2, sortkey: -2, header_yn: "0", bezeichnung: "-- End --"})
    }
}

export class Song {
    constructor(data) {
        this._data = data
    }

    get name() {
        /**
         * Name of the song
         * 
         * Returns:
         *     str: Name of the song
        **/
        return this._data["bezeichnung"]
    }

    get arrangementIdList() {
        /**
         * List of arrangement Ids
         * 
         * Returns:
         *     list[int]: List of arrangement Ids
         */
        return Object.keys(this._data["arrangement"])
    }

    get arrangementList() {
        /**
         * List of song arrangements
         * 
         * Returns:
         *     list[SongArrangement]: List of song arrangements
         */
        var arrangementList = []
        for (const [_, arrangementData] of Object.entries(this._data["arrangement"])) {
            var arrangement = new SongArrangement(arrangementData, this)
            arrangementList.push(arrangement)
        }
        return arrangementList
    }
}

export class SongArrangement {
    constructor(data, song) {
        this._data = data
        this._song = song
    }

    get song() {
        /**
         * Song of this arrangement
         * 
         * Returns:
         *     Song: Song of this arrangement
        **/
        return this._song
    }

    get name() {
        /**
         * Name of the song arrangement
         * 
         * Returns:
         *     str: Name of the song arrangement
        **/
        return this._data["bezeichnung"]
    }

    get id() {
        /**
         * Id of the song arrangement
         * 
         * Returns:
         *     int: Id of the song arrangement
        **/
        return Number(this._data["id"])
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

    getPreviousItem() {
        /**
         * Get the previous live agenda item
         * 
         * Returns:
         *     AgendaItem|null: Previous live agenda item or null if the current one is the last one
        **/
        return this._agenda.getItemAtPosition(this.positionId - 1)
    }
    
    getCurrentItem() {
        /**
         * Get the current live agenda item
         * 
         * Returns:
         *     AgendaItem: Current live agenda item
        **/
        return this._agenda.getItemAtPosition(this.positionId)
    }


    getNextItem() {
        /**
         * Get the next live agenda item
         * 
         * Returns:
         *     AgendaItem|null: Next live agenda item or null if the current one is the last one
        **/
        return this._agenda.getItemAtPosition(this.positionId + 1)
    }

    static getLiveAgendaPosition(agenda, positionId, secondsToAdd=0) {
        return new AgendaLivePosition({pos_id: positionId, addseconds: secondsToAdd}, agenda)
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
        })
    }

    get _itemListKeys() {
        /**
         * Get the agenda items sortkeys as a list of integers
         * 
         * Returns:
         *     list[int]: List of the agenda items sortkeys
         */
        var keyStringList = Object.keys(this._items).sort((a, b) => {
            return a - b
        })
        var keyNumberList = []
        keyStringList.forEach(key => {
            keyNumberList.push(Number(key))
        })
        return keyNumberList
    }

    getItemSortkeyFromPositionId(positionId) {
        /**
         * Translates position id to agenda item sortkey
         * 
         * Args:
         *     positionId (int): Position id to translate
         * 
         * Returns:
         *     int: Translated position id
         */
        if (0 == positionId) return -1
        else if (this.getLastItemPositionId() < positionId) return -2
        return this._itemListKeys.at(positionId - 1)
    }

    getPositionIdFromItemSortkey(sortkey) {
        /**
         * Translates sortkey to agenda item position id
         * 
         * Args:
         *     sortkey (int): Agenda item sortkey to translate
         * 
         * Returns:
         *     int: Translated position id
         */
        if (-1 == sortkey) return 0
        else if (-2 == sortkey) return this.getLastItemPositionId() + 1
        return this._itemListKeys.indexOf(sortkey) + 1
    }

    getLastItemPositionId() {
        /**
         * Get the position id of this agendas last item (excluding virtual end item)
         * 
         * Returns:
         *     int: This agendas list item position id
        **/
        var sortkeyList = this._itemListKeys
        var lastSortkey = sortkeyList[sortkeyList.length - 1]
        // Catch the edge case of an infinite loop between getPositionIdFromItemSortkey and getLastItemPositionId
        if (-2 == lastSortkey) throw "Infinite loop error"
        return this.getPositionIdFromItemSortkey(lastSortkey)
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
        var item = null
        if (0 == positionId) item = AgendaItem.startItem()
        else if (0 < positionId && positionId <= this.getLastItemPositionId()) item = this._items[this.getItemSortkeyFromPositionId(positionId)]
        else if (this.getLastItemPositionId() + 1 == positionId) item = AgendaItem.endItem()
        return item
    }

    getAllSongItems() {
        /**
         * Get all items that are songs
         * 
         * Returns:
         *     list[AgendaItem]: All items that are songs
         */
        var songItemList = []
        for (const [_, item] of Object.entries(this._items)) {
            if (item.isSong()) songItemList.push(item)
        }
        return songItemList
    }
}

