import React from "react";
import cv from "@techstark/opencv-js";
import * as tmImage from '@teachablemachine/image';
import TilePrediction, { TilePredictionProps } from "../components/TilePrediction/TilePrediction";
import ImageProcessor from "../scripts/ImageProcessor";

const URL = "";

export default function Testing()
{
	const [counter, setCounter] = React.useState(0);
	const [model, setModel] = React.useState<tmImage.CustomMobileNet | null>(null);
	const [predictionProps, setPredictionProps] = React.useState<TilePredictionProps[]>([]);

	React.useEffect(() =>
	{
		const modelURL = URL + "model.json";
		const metadataURL = URL + "metadata.json";

		tmImage.load(modelURL, metadataURL).then((mod) =>
		{
			setModel(mod);
			
		});
	}, [null]);


	// Upload an image
	const image = React.useRef<HTMLImageElement | null>(null);
	const image_1 = React.useRef<HTMLCanvasElement | null>(null);
	const image_2 = React.useRef<HTMLCanvasElement | null>(null);
	const image_3 = React.useRef<HTMLCanvasElement | null>(null);

	

	// Button to load the next image
	const nextImage = () =>
	{
		if (image_3?.current == null || image?.current == null)
			return;

		image.current.src = "/Images/PXL_" + counter + ".jpg";
		image.current.onload = processImage;
		setCounter(counter + 1);
	}

	const skipTen = () =>
	{
		setCounter(counter + 10);
	}


	return (
		<>
			<div>
				<div className="relative">
					<img className="top-0 left-0" src="/PXL_20220327_161640363.jpg" ref={image} />
					{
						predictionProps.map((predProp, index) =>
						{
							return (
								<div key={index} className="absolute top-0 left-0">
									<TilePrediction prediction={predProp.prediction} center={predProp.center} size={predProp.size} rect={predProp.rect} />
								</div>
							)
						})
					}
				</div>
				<button onClick={nextImage} className="w-32 h-20 text-xl bg-cyan-500 rounded-lg shadow-md">Next</button>
				<button onClick={skipTen} className="w-32 h-20 text-xl bg-blue-500 rounded-lg shadow-md">Skip 10</button>
				<canvas ref={image_1} />
				<canvas ref={image_2} />
				<canvas ref={image_3} />
			</div>
		</>
	);
}