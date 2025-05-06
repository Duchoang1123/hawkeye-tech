import random
import colorsys

def generate_random_color() -> tuple[int, int, int]:
    """
    Generate a random RGB color that is visually distinct and not too dark.
    Returns a tuple of (R, G, B) values in range [0, 255].
    """
    # Generate a random hue (0-1)
    hue = random.random()
    # Use high saturation (0.8-1.0) and value (0.8-1.0) to ensure bright, distinct colors
    saturation = random.uniform(0.8, 1.0)
    value = random.uniform(0.8, 1.0)
    
    # Convert HSV to RGB
    r, g, b = colorsys.hsv_to_rgb(hue, saturation, value)
    
    # Convert to 0-255 range and round to integers
    return (
        int(r * 255),
        int(g * 255),
        int(b * 255)
    ) 
