import os
from PIL import Image

src_logo = r"C:\Users\shanm\.gemini\antigravity\brain\f0cf20a4-3f6b-41c8-be59-8d8ff710cdf4\.user_uploaded\media_1790739826702.png"
src_banner = r"C:\Users\shanm\.gemini\antigravity\brain\f0cf20a4-3f6b-41c8-be59-8d8ff710cdf4\.user_uploaded\media_1790739839768.jpg"

mobile_assets = r"d:\laasya academy\mobile\assets\images"
web_assets = r"d:\laasya academy\web\public"

os.makedirs(mobile_assets, exist_ok=True)
os.makedirs(web_assets, exist_ok=True)

# 1. Save header logo directly
logo_img = Image.open(src_logo)
logo_img.save(os.path.join(mobile_assets, "header_logo.png"), "PNG")
logo_img.save(os.path.join(web_assets, "header_logo.png"), "PNG")
print("Saved header_logo.png successfully!")

# 2. Process banner with transparent background
banner_img = Image.open(src_banner).convert("RGBA")
datas = banner_img.getdata()

new_data = []
for item in datas:
    r, g, b, a = item
    # Calculate brightness / distance from pure white
    # Near-white background removal with smooth feathering
    if r > 240 and g > 240 and b > 240:
        # Smooth alpha gradient between 240 and 255
        avg = (r + g + b) / 3.0
        # If very close to 255, alpha is 0
        if avg >= 252:
            new_data.append((r, g, b, 0))
        else:
            alpha = int(255 * (252 - avg) / 12.0)
            new_data.append((r, g, b, max(0, min(255, alpha))))
    elif r > 235 and g > 235 and b > 235:
        avg = (r + g + b) / 3.0
        alpha = int(255 * (255 - avg * 0.4) / 255.0)
        new_data.append((r, g, b, max(0, min(255, alpha))))
    else:
        new_data.append(item)

banner_img.putdata(new_data)
banner_img.save(os.path.join(mobile_assets, "cultural_banner.png"), "PNG")
banner_img.save(os.path.join(web_assets, "cultural_banner.png"), "PNG")
print("Saved transparent cultural_banner.png successfully!")
