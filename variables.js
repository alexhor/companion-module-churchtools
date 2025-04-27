export function UpdateVariables(self) {
    self.setVariableDefinitions([
        { variableId: 'selectedEventName', name: 'Selected event name' },
        { variableId: 'selectedEventId', name: 'Selected event id' },
        { variableId: 'previousAgendaItemName', name: 'Previous agenda item name' },
        { variableId: 'currentAgendaItemName', name: 'Current agenda item name' },
        { variableId: 'nextAgendaItemName', name: 'Next agenda item name' },
        { variableId: 'currentAgendaItemMinutesLeft', name: 'Current agenda item minutes left' },
        { variableId: 'currentAgendaItemSecondsLeft', name: 'Current agenda item seconds left' },
        { variableId: 'currentAgendaItemTimeLeft', name: 'Current agenda item time left' },
        { variableId: 'currentAgendaItemEndTimestamp', name: 'Current agenda item end timestamp' },
    ])
}
