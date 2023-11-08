import { FaceLandmarker, PoseLandmarker, HandLandmarker,FilesetResolver } from '@mediapipe/tasks-vision'

export const createFaceLandmarker = async () =>
	await FaceLandmarker.createFromOptions(
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

export const createPoseLandmarker = async () =>
	await PoseLandmarker.createFromOptions(
		await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
		),
		{
			baseOptions: {
				modelAssetPath:
					'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
				delegate: 'GPU'
			},
			runningMode: 'VIDEO',
		}
	)

export const createHandLandmarker = async () =>
	await HandLandmarker.createFromOptions(
		await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
		),
		{
			baseOptions: {
				modelAssetPath:
					'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
				delegate: 'GPU'
			},
			runningMode: 'VIDEO',
			numHands: 2
		}
	)
