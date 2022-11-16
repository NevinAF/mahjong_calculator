import React from "react";
import TakePicture from "../components/TakePicture/TakePicture";
import TilePrediction, { TilePredictionProps } from "../components/TilePrediction/TilePrediction";
import { useWindowSize } from "../scripts/utils/CustomHooks";
import ImageProcessor from "../scripts/ImageProcessor";

export default function CameraPage()
{
	const imageCanvas = React.useRef<HTMLCanvasElement | null>(null);
	const [imageCanvasContext, setImageCanvasContext] = React.useState<CanvasRenderingContext2D | null>(null);

	React.useEffect(() =>
	{
		if (imageCanvas.current == null)
			return;

		setImageCanvasContext(imageCanvas.current.getContext("2d"));
	}, [imageCanvas]);


	const [tiles, setTiles] = React.useState<TilePredictionProps[]>([]);

	const OnNewPicture = (canvas: HTMLCanvasElement) =>
	{
		ImageProcessor.ImageAsTiles({ inputCanvas: canvas }).then(setTiles);
		if (imageCanvasContext)
		{
			imageCanvasContext.canvas.width = canvas.width;
			imageCanvasContext.canvas.height = canvas.height;
			imageCanvasContext.drawImage(canvas, 0, 0, imageCanvasContext.canvas.width, imageCanvasContext.canvas.height);
		}
	}

	const { width, height } = useWindowSize();

	return (
		<div>
			<h1>Camera</h1>
			<TakePicture OnCapturePicture={OnNewPicture} />
			<div className="absolute" style={{
				// width: width,
				// height: height,
			}}>
				{
					tiles.map((tile, index) => <TilePrediction key={index} props={tile} />)
				}
				<canvas className="object-contain" ref={imageCanvas} />
			</div>
		</div>
	);
}