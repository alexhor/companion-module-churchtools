export function UpdateVariables(self) {
    self.setVariableDefinitions([
        { variableId: 'selectedEventName', name: 'Selected event name' },
        { variableId: 'selectedEventId', name: 'Selected event id' },
        { variableId: 'previousAgendaItemName', name: 'Previous agenda item name' },
        { variableId: 'currentAgendaItemName', name: 'Current agenda item name' },
        { variableId: 'nextAgendaItemName', name: 'Next agenda item name' },
    ])
}
