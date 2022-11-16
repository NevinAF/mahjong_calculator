import React from "react";
import * as cv from "@techstark/opencv-js";

export interface TilePredictionProps
{
	prediction: { className: string; probability: number; }[];
	referenceSize: { width: number; height: number; };
	center: { x: number; y: number; };
	size: { width: number; height: number; };
	rect: number[] | ArrayBufferView;

	sourceImage: ImageData;
}

export default function TilePrediction({ props }: { props: TilePredictionProps })
{
	console.log("props", props);
	props.prediction.sort((a, b) => b.probability - a.probability);


	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const [canvasContext, setCanvasContext] = React.useState<CanvasRenderingContext2D | null>(null);

	React.useEffect(() =>
	{
		if (canvasRef.current)
		{
			if (!canvasContext)
				setCanvasContext(canvasRef.current.getContext("2d"));

			if (canvasContext)
			{
				canvasContext.canvas.width = props.sourceImage.width;
				canvasContext.canvas.height = props.sourceImage.height;
				canvasContext.putImageData(props.sourceImage, 0, 0);
			}
		}
	}, [canvasRef, props.sourceImage]);


	return (
		<div className={`absolute group`} style={{
			top: (props.center.y - props.size.height / 2) + "%",
			left: (props.center.x - props.size.width / 2) + "%",
			width: (props.size.width) + "%",
			height: (props.size.height) + "%",
		}}>
			<img className={`w-full h-full opacity-50`} src={`/mahjong_tiles/${props.prediction[0].className}.png`} alt={props.prediction[0].className} />
			<div className={`absolute pointer-events-none bg-black hidden group-hover:inline`} style={{
				left: "100%",
				top: 0,
			}}>
				<canvas ref={canvasRef} className={`w-20 h-20`}/>
				{
					props.prediction.map((p, i) =>
					{
						return (
							<div key={i} className="text-white text-xl w-[100px]">
								{p.className}: {p.probability.toFixed(2)}
							</div>
						);
					})
				}
			</div>
		</div>
	);
}