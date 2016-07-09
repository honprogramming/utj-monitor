define(['knockout', 'jquery', 'view-models/GeneralViewModel',
        'view-models/events/EventTypes',
        'ojs/ojcore', 'ojs/ojknockout', 'ojs/ojsunburst'],
        function (ko, $, GeneralViewModel, EventTypes) {
            function SunBurst(parser) {
                var self = this;
                
                self.nodeValues = ko.observableArray([]);
                self.nodeValues([parser.parseData()]);
                
                self.clickHandler = function (ui, data) {
                    if (data.option === "selection") {
                        var id = data.value[0];
                        
                        self.onClick(id);
                    }
                };
            }
            
            SunBurst.prototype = Object.create(GeneralViewModel);
            var prototype = SunBurst.prototype;
            
            prototype.addClickListener = function(listener) {
                this.addListener(listener, EventTypes.CLICK_EVENT);
            };
            
            prototype.onClick = function(id) {
                this.callListeners(EventTypes.CLICK_EVENT, id);
            };
            
            return SunBurst;
        }
);
