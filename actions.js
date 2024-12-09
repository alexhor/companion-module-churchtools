import { InstanceStatus } from '@companion-module/base'

export function UpdateActions(self) {
    self.setActionDefinitions({
        reloadNextEvent: {
            name: 'Reload Next Event',
            options: [],
            callback: async () => {
                try {
                    self.reloadNextEvent()
                    self.updateStatus(InstanceStatus.Ok)
                } catch (e) {
                    self.log('error', `Reloading next event failed (${e.message})`)
                    self.updateStatus(InstanceStatus.UnknownError, e.code)
                }
            },
        },
        nextAgendaItem: {
            name: 'Next agenda item',
            options: [],
            callback: async () => {
                try {
                    await self.nextAgendaItem()
                    self.updateStatus(InstanceStatus.Ok)
                } catch (e) {
                    self.log('error', `Going to next agenda item failed (${e.message})`)
                    self.updateStatus(InstanceStatus.UnknownError, e.code)
                }
            },
        },
        previousAgendaItem: {
            name: 'Previous agenda item',
            options: [],
            callback: async () => {
                try {
                    await self.previousAgendaItem()
                    self.updateStatus(InstanceStatus.Ok)
                } catch (e) {
                    self.log('error', `Going to previous agenda item failed (${e.message})`)
                    self.updateStatus(InstanceStatus.UnknownError, e.code)
                }
            },
        },
        agendaItemAddTime: {
            name: 'Agenda item add time',
            options: [
                {
					id: 'secondsToAdd',
					type: 'number',
					label: 'Seconds to add',
					default: 60,
					min: 0,
				},
            ],
            callback: async (event) => {
                try {
                    await self.agendaItemAddTime(event.options.secondsToAdd)
                    self.updateStatus(InstanceStatus.Ok)
                } catch (e) {
                    self.log('error', `Adding time to agenda item failed (${e.message})`)
                    self.updateStatus(InstanceStatus.UnknownError, e.code)
                }
            },
        },
        agendaItemReduceTime: {
            name: 'Agenda item reduce time',
            options: [
                {
					id: 'secondsToReduce',
					type: 'number',
					label: 'Seconds to reduce',
					default: 60,
					min: 0,
				},
            ],
            callback: async (event) => {
                try {
                    await self.agendaItemReduceTime(event.options.secondsToReduce)
                    self.updateStatus(InstanceStatus.Ok)
                } catch (e) {
                    self.log('error', `Reducing time of agenda item failed (${e.message})`)
                    self.updateStatus(InstanceStatus.UnknownError, e.code)
                }
            },
        },
    })
}
