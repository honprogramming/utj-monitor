define(
        [   
            'jquery',
            'knockout',
            'view-models/GeneralViewModel',
            'modules/pide/model/PlanElementCalculated',
            'modules/pide/model/PlanElementMeasurable',
            'modules/pide/model/PlanElementTypes',
            'events/EventTypes',
            'data/RESTConfig',
            'utils/Colors',
            'ojs/ojcore', 'ojs/ojknockout', 'ojs/ojgauge', 'ojs/ojcollapsible', 
            'ojs/ojmasonrylayout', 'ojs/ojbutton', 'ojs/ojmodule'
        ],
        function ($, ko, GeneralViewModel, PlanElementCalculated, PlanElementMeasurable,
                PlanElementTypes, EventTypes, RESTConfig, Colors) {
            var theKey = {};

            function DetailsViewModel(controlPanelModel) {
                var self = this;
                this.listeners = [];

                var privateData = {
                    controlPanelModel: controlPanelModel,
                    statusMeterPlanElementsMap: {},
                    collapsiblePanelTitles: ["Ver mas", "Ocultar"],
                    indicator: undefined,
                    cardModel: undefined,
                    cache: true,
                    selectedPlanElement: undefined
                };

                this.DetailsViewModel_ = function (key) {
                    if (theKey === key) {
                        return privateData;
                    }
                };

                this.selectedPlanElement = ko.observable();
                this.currentParents = ko.observableArray();
                this.currentChildren = ko.observableArray();
                this.childrenType = ko.observable();
                this.collapsibleParentsPanelTitle = ko.observable(privateData.collapsiblePanelTitles[0]);
                this.collapsibleChildrenPanelTitle = ko.observable(privateData.collapsiblePanelTitles[0]);
                self.cardModule = ko.observable({viewName: 'empty'});

                this.collapseParentsHandler = function (event, ui) {
                    if (ui["option"] === "expanded") {
                        self.collapsibleParentsPanelTitle(privateData.collapsiblePanelTitles[ui["value"] ? 1 : 0]);
                    }
                };

                this.collapseChildrenHandler = function (event, ui) {
                    if (ui["option"] === "expanded") {
                        self.collapsibleChildrenPanelTitle(privateData.collapsiblePanelTitles[ui["value"] ? 1 : 0]);
                    }
                };

                this.clickHandler = function (data, event) {
                    self.onClick(data.clickHandlerValue);
                };

                this.flipHandler = function (data, event) {
                    var target = event.target;
                    var tile = $(target).closest(".demo-tile");

                    var tileFront = tile.find(".demo-tile-front");
                    var tileBack = tile.find(".demo-tile-back");

                    var bForward = tileBack.hasClass("demo-hidden");
                    var f = function () {
                        flipEnd(data, tile, tileFront, tileBack, bForward);
                    };
                    tile[0]._flipFunc = f;
                    tile[0].addEventListener("transitionend", f, false);
                    tile[0].addEventListener("webkittransitionend", f, false);

                    //Unhide the new side of the tile to which it is flipping, 
                    //and flip that side by 180 degrees so that it is facing the 
                    //opposite direction of the current side.  The new side will
                    //then be facing the user after the tile itself is flipped by 
                    //180 degrees.  
                    if (bForward)
                    {
                        tileBack.removeClass("demo-hidden");
                        tileBack.addClass("demo-flipped");
                    } else
                    {
                        tileFront.removeClass("demo-hidden");
                        tileFront.addClass("demo-flipped");
                    }
                    
                    //Flip the tile itself.
                    tile.addClass(bForward ?
                            "demo-flip-forward" :
                            "demo-flip-backward");
                    event.stopPropagation();
                };

                //Called after the flip transition ends.
                flipEnd = function (data, tile, tileFront, tileBack, bForward)
                {
                    var f = tile[0]._flipFunc;
                    tile[0]._flipFunc = null;
                    tile[0].removeEventListener("transitionend", f, false);
                    tile[0].removeEventListener("webkittransitionend", f, false);

                    var button = null;
                    if (bForward)
                    {
                        //Remove the flip class from the tile itself so the tile is
                        //no longer rotated.
                        tile.removeClass("demo-flip-forward");
                        //Hide the old side of the tile that is no longer showing.
                        tileFront.addClass("demo-hidden");
                        //Remove the flip class from the new side of the tile so 
                        //that it is no longer rotated.  This side still faces the
                        //user because the tile itself is no longer rotated.
                        tileBack.removeClass("demo-flipped");
                        //Find the flip button on the new tile side.
                        button = tileBack.find(".demo-back-flip-icon");
                    } else
                    {
                        //Remove the flip class from the tile itself so the tile is
                        //no longer rotated.
                        tile.removeClass("demo-flip-backward");
                        //Hide the old side of the tile that is no longer showing.
                        tileBack.addClass("demo-hidden");
                        //Remove the flip class from the new side of the tile so 
                        //that it is no longer rotated.  This side still faces the
                        //user because the tile itself is no longer rotated.
                        tileFront.removeClass("demo-flipped");
                        //Find the flip button on the new tile side.
                        button = tileFront.find(".demo-front-flip-icon");
                    }
                    //Before the tile was flipped, the button used to flip the 
                    //tile had focus, so now restore focus to the flip button on
                    //the side of the tile that is now showing.
                    button[0].focus();
                    
                    self.populateChart(data.values.id.replace("i_", ""));
                };
                
                self.chart = ko.observable({viewName: 'empty'});
                self.cardClickHandler = function() {
                    self.cardModule(
                            {
                                name: 'pide/indicator', 
                                params: {
                                    indicator: self.getIndicator()
                                }
                            }
                    );
            
                    $("#details-dialog").ojDialog("open");
                };
            }

            DetailsViewModel.prototype = Object.create(GeneralViewModel);
            var prototype = DetailsViewModel.prototype;
            
            prototype.populateChart = function(indicatorId) {
                $.getJSON(`${RESTConfig.indicators.pide.path}/${indicatorId}`)
                    .then(
                        indicator => {
                            const goals = indicator.achievements.filter(a => a.achievementType === "GOAL");
                            const progress = indicator.achievements.filter(a => a.achievementType === "PROGRESS");
                            
                            const leanGoals = goals.map(
                                g => (
                                    {
                                        value: g.data,
                                        date: new Date(g.date.time)
                                    }
                                )
                            );
                            const leanProgress = progress.map(
                                p => (
                                    {
                                        value: p.data,
                                        date: new Date(p.date.time)
                                    }
                                )
                            );
                            
                            leanGoals.sort((a, b) => a.date - b.date);
                            leanProgress.sort((a, b) => a.date - b.date);
                            
                            let axe, objective;
                            [, axe, objective] = this.currentParents();
                            
                            this.setIndicator({...indicator, axe, objective});
                            this.chart({name: 'pide/chart', params: {goals: leanGoals, progress: leanProgress}});
                        }
                    )
                    .catch(e => console.log(e.message));
            };
            
            prototype.setIndicator = function(i) {
                this.DetailsViewModel_(theKey).indicator = i;
            };
            
            prototype.getIndicator = function() {
                return this.DetailsViewModel_(theKey).indicator;
            };
            
            prototype.getCardModel = function() {
                return this.DetailsViewModel_(theKey).cardModel;
            };
            
            prototype.setCardModel = function(cardModel) {
                this.DetailsViewModel_(theKey).cardModel = cardModel;
            };
            
            prototype.isIndicator = function(type) {
                return type.match(/indica.*/i);
            };
            
            prototype.addSelectionListener = function (listener) {
                this.addListener(listener, EventTypes.SELECTION_EVENT);
            };

            prototype.onClick = function (selectedPlanElementId) {
                var controlPanelModel = this.getControlPanelModel();
                var selectedPlanElement = controlPanelModel.getData()[selectedPlanElementId];
                this.setSelectedItem(selectedPlanElement);
                this.callListeners(EventTypes.SELECTION_EVENT, selectedPlanElement);
            };

            prototype.setSelectedItem = function (selectedPlanElement) {
                this.setSelectedPlanElement(selectedPlanElement);
                const statusMeterPlanElement = this.getStatusMeterPlanElement(selectedPlanElement.getId());

                this.selectedPlanElement(statusMeterPlanElement);
                this.updateParents(selectedPlanElement);
                this.updateChildren(selectedPlanElement);
            };
            
            prototype.refresh = function() {
                if (this.getSelectedPlanElement() &&
                    this.getControlPanelModel().getData()[this.getSelectedPlanElement().getId()]) {
                    this.setCache(false);
                    this.setSelectedItem(this.getSelectedPlanElement());
                    this.setCache(true);
                } else {
                    this.selectedPlanElement(null);
                    this.currentChildren([]);
                    this.currentParents([]);
                }
            };
            
            prototype.setCache = function(cache) {
                this.DetailsViewModel_(theKey).cache = cache;
            };
            
            prototype.getCache = function() {
                return this.DetailsViewModel_(theKey).cache;
            };
            
            prototype.getSelectedPlanElement = function() {
                return this.DetailsViewModel_(theKey).selectedPlanElement;
            };
            
            prototype.setSelectedPlanElement = function(selectedPlanElement) {
                this.DetailsViewModel_(theKey).selectedPlanElement = selectedPlanElement;
            };
            
            prototype.getStatusMeterPlanElement = function (id) {
                var statusMeterPlanElementsMap = this.getStatusMeterPlanElementsMap();
                var statusMeterPlanElement = statusMeterPlanElementsMap[id];

                if (!statusMeterPlanElement || !this.getCache()) {                    
                    const controlPanelModel = this.getControlPanelModel();
                    const planElement = controlPanelModel.getData()[id];
                    
                    return addNewPlanElementToMap.call(this, planElement,
                            controlPanelModel, statusMeterPlanElementsMap);
                } else {
                    return statusMeterPlanElement;
                }
            };

            prototype.getStatusMeterPlanElementsMap = function () {
                return this.DetailsViewModel_(theKey).statusMeterPlanElementsMap;
            };

            prototype.updateChildren = function (selectedPlanElement) {
                var childrenPlanElement = [];
                var children = selectedPlanElement.getChildren(PlanElementCalculated);

                if (children && children.length > 0) {
                    for (var i = 0; i < children.length; i++) {
                        var child = this.getStatusMeterPlanElement(children[i].getId());
                        childrenPlanElement.push(child);
                    }

                    if (children && children.length > 0) {
                        this.childrenType(this.nls("controlPanel." + PlanElementTypes.getPlural(children[0].getType())));
                    }
                }

                this.currentChildren(childrenPlanElement);
            };

            prototype.updateParents = function (selectedPlanElement) {
                var parents = getParents.call(this, selectedPlanElement,
                        this.getControlPanelModel(), this.getStatusMeterPlanElementsMap());
                this.currentParents(parents);
            };

            function getParents(planElement) {
                var parentElements = [];

                while (planElement.getParent()) {
                    planElement = planElement.getParent();

                    var id = planElement.getId();
                    var statusMeterElement = this.getStatusMeterPlanElement(id);

                    parentElements.unshift(statusMeterElement);
                }

                return parentElements;
            }

            /**
             * Getter method for ControlPanel
             * @returns The ControlPanel Model.
             */
            prototype.getControlPanelModel = function () {
                return this.DetailsViewModel_(theKey).controlPanelModel;
            };

            function addNewPlanElementToMap(element, controlPanelModel, statusMeterPlanElementsMap) {
                var planElement = controlPanelModel.getData()[element.getId()];
                var statusMeterPlanElement = createStatusMeterPlanElement.call(this, planElement);

                statusMeterPlanElementsMap[planElement.getId()] = statusMeterPlanElement;
                return statusMeterPlanElement;
            }

            function createStatusMeterPlanElement(element) {
                const progress = Math.round(element.getProgress() * 100);
                const referenceLines = [{value: 0, color: "#000000"}];
                let thresholdValues = [
                    {max: 40, color: "#DF0101"},
                    {max: 60, color: "#FE9A2E"},
                    {max: 90, color: "#D7DF01"},
                    {color: "#31B404"}
                ];
                
                if (element instanceof PlanElementMeasurable) {
                    thresholdValues = element.getGrades().map(
                        e => (
                            {
                                max: e.maxPercentage,
                                color: Colors.defaultColors[e.color].color
                            }
                        )
                    );
                }
                
                var translatedType = this.nls("controlPanel." + element.getType());
                var children = element.getChildren();
                var childrenType = null;
                
                if (children) {
                    children = children.filter(
                            function(element) {
                                return ! ((element instanceof PlanElementCalculated) ||
                                        (element instanceof PlanElementMeasurable));
                            }
                    );
            
                    childrenType =  children.length > 0 ? PlanElementTypes.getPlural(children[0].getType()) : null;
                    
                    if (childrenType) {
                        childrenType = this.nls("controlPanel." + childrenType);
                    }
                }
                                
                const statusMeterElement = {
                    type: translatedType,
                    text: element.getName(),
                    children: children,
                    childrenType: childrenType,
                    clickHandlerValue: element.getId(),
                    doesItFlip: element.getType() === PlanElementTypes.INDICATOR,
                    values: {
                        id: element.getId(),
                        min: isNaN(progress) ? 0 : progress < 0 ? progress : 0,
                        max: 100,
                        value: isNaN(progress) ? 0 : progress,
                        title: {text: progress + '%', position: 'center'},
                        thresholdValues: thresholdValues,
                        referenceLines: progress < 0 ? referenceLines : undefined
//                        ,
//                        tooltipRenderer: toolTipStatusMeter
                    }
                };
                
                let responsible = element.getResponsibles();
                
                if (responsible) {
                    statusMeterElement.responsible = {
//                        name: responsible['player']['name'],
                        area: responsible['area']['name'],
                        job: responsible['jobTitle']['name'],
                        phone: responsible['player']['phones'][0]['number']
                    };
                }

                return statusMeterElement;

//                function toolTipStatusMeter(dataContext) {
//                    var id = dataContext.component()[0].id;
//                    var element = planElementsMap[id];
//                    var achieve = element["node"]["achieve"];
//                    var goal = element["node"]["goal"];
//                    
//                    //add to a <table>
//                    var toolTip = document.createElement("div");
//                    var toolTipValue = document.createElement("div");
//                    var toolTipTextValue = document.createTextNode("value: " + achieve);
//                    toolTipValue.appendChild(toolTipTextValue);
//                    toolTip.appendChild(toolTipValue);
//                    
//                    var toolTipGoal = document.createElement("div");
//                    var toolTipTextGoal = document.createTextNode("goal: " + goal);
//                    toolTipGoal.appendChild(toolTipTextGoal);
//                    toolTip.appendChild(toolTipGoal);
//
//                    return toolTip;
//                }
            }

            return DetailsViewModel;
        }
);