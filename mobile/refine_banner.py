from PIL import Image, ImageFilter
import numpy as np
from collections import deque

src_banner = r"C:\Users\shanm\.gemini\antigravity\brain\f0cf20a4-3f6b-41c8-be59-8d8ff710cdf4\.user_uploaded\media_1790739839768.jpg"
im = Image.open(src_banner).convert("RGBA")
w, h = im.size
pixels = np.array(im, dtype=np.uint8)

# Mask for background: start from all border pixels that are near white
is_near_white = (pixels[:, :, 0] > 235) & (pixels[:, :, 1] > 235) & (pixels[:, :, 2] > 235)

bg_mask = np.zeros((h, w), dtype=bool)
queue = deque()

# Add all perimeter pixels that are near white
for x in range(w):
    if is_near_white[0, x]:
        bg_mask[0, x] = True
        queue.append((x, 0))
    if is_near_white[h - 1, x]:
        bg_mask[h - 1, x] = True
        queue.append((x, h - 1))

for y in range(h):
    if is_near_white[y, 0]:
        bg_mask[y, 0] = True
        queue.append((0, y))
    if is_near_white[y, w - 1]:
        bg_mask[y, w - 1] = True
        queue.append((w - 1, y))

# Breadth-first flood fill from boundary
neighbors = [(-1, 0), (1, 0), (0, -1), (0, 1)]
while queue:
    cx, cy = queue.popleft()
    for dx, dy in neighbors:
        nx, ny = cx + dx, cy + dy
        if 0 <= nx < w and 0 <= ny < h:
            if not bg_mask[ny, nx] and is_near_white[ny, nx]:
                bg_mask[ny, nx] = True
                queue.append((nx, ny))

# Alpha mask: 0 where bg_mask is True, 255 where False
alpha_array = np.where(bg_mask, 0, 255).astype(np.uint8)
alpha_img = Image.fromarray(alpha_array, mode="L")
# Feather edges slightly with 1px Gaussian blur
alpha_feathered = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.2))

im.putalpha(alpha_feathered)

mobile_path = r"d:\laasya academy\mobile\assets\images\cultural_banner.png"
web_path = r"d:\laasya academy\web\public\cultural_banner.png"
im.save(mobile_path, "PNG")
im.save(web_path, "PNG")
print("Perfect feathered transparent banner saved successfully!")
