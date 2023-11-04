import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export const createFaceLandmarker = async () => {
	return await FaceLandmarker.createFromOptions(
		await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
		),
		{
			baseOptions: {
				modelAssetPath:
					'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
				delegate: 'GPU'
			},
			runningMode: 'VIDEO',
			numFaces: 1
		}
	)
}
