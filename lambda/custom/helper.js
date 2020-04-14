// Helper Functions ===================================================================
module.exports = {
    getMemoryAttributes: function () {
        const memoryAttributes = {
            "history": [],


            "launchCount": 0,
            "lastUseTimestamp": 0,

            "lastSpeechOutput": {},
            // "nextIntent":[]

            // "favoriteColor":"",
            // "name":"",
            // "namePronounce":"",
            // "email":"",
            // "mobileNumber":"",
            // "city":"",
            // "state":"",
            // "postcode":"",
            // "birthday":"",
            // "bookmark":0,
            // "wishlist":[],
        };
        return memoryAttributes;
    },

    capitalize: function (myString) {

        return myString.replace(/(?:^|\s)\S/g, function (a) {
            return a.toUpperCase();
        });
    },

    getSlotValues: function (filledSlots) {
        const slotValues = {};

        Object.keys(filledSlots).forEach((item) => {
            const name = filledSlots[item].name;

            if (filledSlots[item] &&
                filledSlots[item].resolutions &&
                filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
                filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
                filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                    case 'ER_SUCCESS_MATCH':
                        slotValues[name] = {
                            heardAs: filledSlots[item].value,
                            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                            ERstatus: 'ER_SUCCESS_MATCH'
                        };
                        break;
                    case 'ER_SUCCESS_NO_MATCH':
                        slotValues[name] = {
                            heardAs: filledSlots[item].value,
                            resolved: '',
                            ERstatus: 'ER_SUCCESS_NO_MATCH'
                        };
                        break;
                    default:
                        break;
                }
            } else {
                slotValues[name] = {
                    heardAs: filledSlots[item].value || '', // may be null 
                    resolved: '',
                    ERstatus: ''
                };
            }
        }, this);

        return slotValues;
    },
}
 
let welcomeCardImg = {
    smallImageUrl: "https://www.ottogroup.com/media/img/7-Konzernfirmen/otto/OTTO-Logo-2015.jpg",
    largeImageUrl: "https://customercarecontacts.com/wp-content/uploads/2019/08/otto-logo.jpg"
}

module.exports.welcomeCardImg = welcomeCardImg;