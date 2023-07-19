import { Request, Response } from 'express';
import fetch from 'node-fetch';

// ************ One Signal ***************//
export const onesignal = async (req: Request, res: Response) => {
    console.log(req.body);
    const { tokenIdList, contents, heading } = req.body;

    try {
        const response = await sendNotification(tokenIdList, contents, heading);
        res.json(response);
    } catch (error: any) {
        res.status(500).json({ error: 'Something went wrong', message: error.message });
    }
};

async function sendNotification(tokenIdList: string[], contents: string, heading: string) {
    const apiUrl = 'https://onesignal.com/api/v1/notifications';
    const appId = 'db13122e-448d-4418-9df0-b83989eef9ab'; // Replace with your OneSignal App ID
    const apiKey = 'MzQ2YWQ3OGUtYWU5OC00Y2MzLWEyM2EtNjEyNjE2ODZkYmJl'; // Replace with your OneSignal API Key

    const data = {
        app_id: appId,
        include_player_ids: tokenIdList,
        android_accent_color: 'FF9976D2',
        small_icon: 'ic_stat_onesignal_default',
        headings: { en: heading },
        contents: { en: contents },
    };

    const config = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            Authorization: `Basic ${apiKey}`,
            'Content-Type': 'application/json' // Updated
        },
        body: JSON.stringify(data)
    };

    try {
        const response = await fetch(apiUrl, config);
        const jsonResponse = await response.json();
        return jsonResponse;
    } catch (error: any) {
        throw new Error(`Error sending notification: ${error.message}`);
    }
}

// // Call the function to send the notification
// sendNotification(["773f0ac8-e904-45b9-b2ef-a6fc250da2b2"], "Notification content", "Notification heading")
//     .then(json => console.log(json))
//     .catch(err => console.error('error:' + err));
//******* Expoexport*****/
export const sendNotificationMethode = async (tokenIdList: string[], contents: string, heading: string) => {
    const apiUrl = 'https://onesignal.com/api/v1/notifications';
    const appId = 'db13122e-448d-4418-9df0-b83989eef9ab'; // Replace with your OneSignal App ID
    const apiKey = 'MzQ2YWQ3OGUtYWU5OC00Y2MzLWEyM2EtNjEyNjE2ODZkYmJl'; // Replace with your OneSignal API Key

    const data = {
        app_id: appId,
        include_player_ids: tokenIdList,
        android_accent_color: 'FF9976D2',
        small_icon: 'ic_stat_onesignal_default',
        headings: { en: heading },
        contents: { en: contents },
    };

    const config = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            Authorization: `Basic ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    try {
        const response = await fetch(apiUrl, config);
        const jsonResponse = await response.json();
        return jsonResponse;
    } catch (error: any) {
        throw new Error(`Error sending notification: ${error.message}`);
    }
};
