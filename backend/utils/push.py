import json
from pywebpush import webpush, WebPushException
from config.settings import get_settings


def send_push_notification(subscription_json_str: str, payload_dict: dict) -> bool:
    """Send a Web Push notification to a specific subscriber using pywebpush.

    Args:
        subscription_json_str: The stored JSON string of the push subscription.
        payload_dict: The dictionary data to send as the notification payload.

    Returns:
        bool: True if successful, False otherwise.
    """
    if not subscription_json_str:
        return False

    try:
        subscription_info = json.loads(subscription_json_str)
        settings = get_settings()

        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload_dict),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": settings.VAPID_CLAIM_EMAIL,
            },
        )
        return True
    except WebPushException as ex:
        print(f"Web Push failed with WebPushException: {ex}")
        # If status is 410, subscription has expired or been removed
        return False
    except Exception as ex:
        print(f"Unexpected error in send_push_notification: {ex}")
        return False
