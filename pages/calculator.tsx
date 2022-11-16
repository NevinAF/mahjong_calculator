import React from "react";
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import Script from "next/script.js";
import cv from "@techstark/opencv-js";

const URL = "/tm-my-image-model/";

export default function Calculator()
{
	// Get webcam video stream
	const videoRef = React.useRef<HTMLVideoElement>(null);
	const [videoStream, setVideoStream] = React.useState<MediaStream | null>(null);
	React.useEffect(() =>
	{
		navigator.mediaDevices.getUserMedia({ video: true })
			.then((stream) =>
			{
				setVideoStream(stream);
				if (videoRef.current)
				{
					videoRef.current.srcObject = stream;
				}
			})
			.catch((err) =>
			{
				console.log(err);
			});
	}, []);

	// Get canvas context
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const [canvasContext, setCanvasContext] = React.useState<CanvasRenderingContext2D | null>(null);
	React.useEffect(() =>
	{
		if (canvasRef.current)
		{
			setCanvasContext(canvasRef.current.getContext("2d"));
		}
	}, []);

	const [model, setModel] = React.useState<tmImage.CustomMobileNet | null>(null);

	const [prediction, setPrediction] = React.useState<{className: string; probability: number;}[] | null>(null);
	const [updating, setUpdating] = React.useState(false);

	const updateFrame = async () =>
	{
		if (videoStream && canvasContext)
		{
			const video = videoRef.current;
			const canvas = canvasRef.current;
			if (video && canvas)
			{
				canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

				try
				{
					console.log("Predicting...");
					let mat = cv.imread(canvasContext?.canvas);
					cv.cvtColor(mat, mat, cv.COLOR_BGR2HSV, 0);
					cv.inRange(mat,
						new cv.Mat(mat.rows, mat.cols, mat.type(), [0, 0, 180, 0]),
						new cv.Mat(mat.rows, mat.cols, mat.type(), [255, 90, 255, 0]),
						mat);
					var contours = new cv.MatVector();
					var hierarchy = new cv.Mat();
					cv.findContours(mat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

					console.log(contours.size() as unknown as number);

					const goodContours = [];
					for (let i = 0; i < (contours.size() as unknown as number); ++i)
					{
						console.log("Contour " + i);
						
						const contour_area = cv.contourArea(contours.get(i));
						if (contour_area < 50)
						{
							console.log("Contour area too small");
							continue;
						}
						
						cv.convexHull(contours.get(i), contours.get(i));

						const arclen = cv.arcLength(contours.get(i), true);
						const approx = new cv.Mat();
						cv.approxPolyDP(contours.get(i), approx, 0.1 * arclen, true);

						console.log("approx.rows: " + approx.rows);
						if ((approx.rows !== 4))
						{
							continue;
						}
	
						const approx_area = cv.contourArea(approx);
						if (approx_area < contour_area * 0.85 || approx_area > contour_area * 1.15)
						{
							console.log("approx area", approx_area, "contour area", contour_area);
							continue;
						}

						goodContours.push(approx);
					}

					console.log("good contours", goodContours.length);

					if (goodContours.length > 0)
					{
						// create mat with these points [[0, 0], [0, 200], [200, 200], [200, 0]]
						console.log(goodContours[0]);
						const dst = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, 0, 0, 0, 200, 0, 0, 200, 200, 0, 0, 200, 0, 0, 0]);
						console.log("Hello!");
						
						const M = cv.getPerspectiveTransform(goodContours[0], dst);
						cv.warpPerspective(mat, mat, M, new cv.Size(200, 200));

						cv.imshow(canvasContext?.canvas, mat);
						console.log("Done with canvas...")
					}
					mat.delete();
				} catch (err)
				{
					console.log(err);
				}

				// console.log("Predicting...", model);

				if (model == null)
				{
					const modelURL = URL + "model.json";
					const metadataURL = URL + "metadata.json";

					setModel(await tmImage.load(modelURL, metadataURL));
				}
				else
				{
					if (canvas.width <= 0 || canvas.height <= 0) return;
					const pred = await model.predict(canvas);
					// console.log(pred);
					setPrediction(pred);
				}
			}
		}

		requestAnimationFrame(updateFrame);
	}

	React.useEffect(() =>
	{
		requestAnimationFrame(updateFrame);
	}, [videoStream, canvasContext, model]);

	// Draw webcam video to canvas
	React.useEffect(() =>
	{
		if (videoStream && canvasContext)
		{
			const video = videoRef.current;
			const canvas = canvasRef.current;
			if (video && canvas)
			{
				canvas.width = 200;
				canvas.height = 200;
			}
		}
	}, [videoStream, canvasContext]);

	

	// Upload an image
	const [image, setImage] = React.useState<File | null>(null);

	const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) =>
	{
		if (e.target.files && e.target.files.length > 0)
		{
			setImage(e.target.files[0]);
		}
	};



	return (
		<>
			<div>
				<h1>Calculator</h1>
				<video ref={videoRef} autoPlay muted></video>
				<canvas ref={canvasRef}></canvas>
				<button onClick={changeCamera}>Change Camera</button>
				{
					prediction && prediction.map((p, i) =>
					{
						return (
							<div key={i}>
								<p>{p.className}: {p.probability.toFixed(2)}</p>
							</div>
						);
					})
				}
			</div>
			<input type="file" onChange={uploadImage}/>
		</>
	);
}