import numpy as np 
import cv2
import os

class ViewTransformer():
    def __init__(self, vertical=True):
        court_width = 9
        court_length = 18
        
        # Create target vertices based on vertical parameter
        if vertical:
            self.target_vertices = np.array([
                [0, 0],
                [court_width, 0],
                [court_width, court_length],
                [0, court_length]
            ])
        else:
            self.target_vertices = np.array([
                [0, 0],
                [0, court_width],
                [court_length, court_width],
                [court_length, 0]
            ])

        self.target_vertices = self.target_vertices.astype(np.float32)
        self.perspective_transformer = None
        self.vertical = vertical

    def calibrate(self, video_name, frame_number=0):
        """
        Calibrate the view transformer by selecting four points on a video frame.
        
        Args:
            video_path (str): Path to the video file
            frame_number (int): Frame number to use for calibration (default: 0)
        """

        video_path = os.path.join(os.path.dirname(__file__), '..', '..', 'videos', video_name)
        # Open the video file
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
        
        # Set the frame position
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame = cap.read()
        if not ret:
            raise ValueError(f"Could not read frame {frame_number} from video")
        
        # Create a copy of the frame for drawing
        frame_copy = frame.copy()
        
        # List to store selected points
        points = []
        
        def mouse_callback(event, x, y, flags, param):
            if event == cv2.EVENT_LBUTTONDOWN:
                if len(points) < 4:
                    points.append((x, y))
                    # Draw the point
                    cv2.circle(frame_copy, (x, y), 5, (0, 255, 0), -1)
                    # Draw the point number
                    cv2.putText(frame_copy, str(len(points)), (x-10, y-10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                    cv2.imshow('Calibration', frame_copy)
        
        # Create window and set mouse callback
        cv2.namedWindow('Calibration')
        cv2.setMouseCallback('Calibration', mouse_callback)
        
        # Display instructions
        print("Click on the four corners of the court in this order:")
        print("1. Top-left")
        print("2. Top-right")
        print("3. Bottom-right")
        print("4. Bottom-left")
        print("Press 'Q' when finished")
        
        # Show the frame
        cv2.imshow('Calibration', frame_copy)
        
        while True:
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == ord('Q'):
                break
        
        cv2.destroyAllWindows()
        cap.release()
        
        if len(points) != 4:
            raise ValueError("You must select exactly 4 points")
        
        # Update the pixel vertices
        self.pixel_vertices = np.array(points, dtype=np.float32)
        
        # Calculate the perspective transform
        self.perspective_transformer = cv2.getPerspectiveTransform(self.pixel_vertices, self.target_vertices)
        
        print("Calibration completed successfully!")

    def transform_point(self, point, extrapolation=True):
        if not hasattr(self, 'pixel_vertices') or self.perspective_transformer is None:
            return None
            
        p = (int(point[0]), int(point[1]))
        is_inside = cv2.pointPolygonTest(self.pixel_vertices, p, False) >= 0
        if not is_inside and not extrapolation:
            return None

        reshaped_point = point.reshape(-1,1,2).astype(np.float32)
        transformed_point = cv2.perspectiveTransform(reshaped_point, self.perspective_transformer)
        
        return transformed_point.reshape(-1,2)

    def add_transformed_position_to_tracks(self,tracks):
        for object, object_tracks in tracks.items():
            for frame_num, track in enumerate(object_tracks):
                for track_id, track_info in track.items():
                    position = track_info['position_adjusted']
                    position = np.array(position)
                    position_trasnformed = self.transform_point(position)
                    if position_trasnformed is not None:
                        position_trasnformed = position_trasnformed.squeeze().tolist()
                    tracks[object][frame_num][track_id]['position_transformed'] = position_trasnformed