
module.exports = {
    // Constants ===========================================================================

    APP_NAME: "Otto Store",
    APP_ID: undefined, // TODO replace with your Skill ID (OPTIONAL).
    FULL_NAME_PERMISSION: "alexa::profile:name:read",
    EMAIL_PERMISSION: "alexa::profile:email:read",
    MOBILE_PERMISSION: "alexa::profile:mobile_number:read",
    messages: {
        NOTIFY_MISSING_PERMISSIONS: 'Please enable profile permissions in the Amazon Alexa app.',
        ERROR: 'Uh Oh. Looks like something went wrong.'
    }
}