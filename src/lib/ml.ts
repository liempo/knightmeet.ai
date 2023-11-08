import { FaceLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

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
