import React from "react";
import FullscreenContainer from "@components/FullscreenContainer";
import CameraCanvas from "@components/CameraCanvas";

export default function fst()
{
	const fullscreenRef = React.useRef<FullscreenContainer>(null);
	const cameraRef = React.useRef<CameraCanvas>(null);



	return (
		<>
			<h1>Testing some stuff</h1>
			<button className="rounded-md w-32 h-20 text-xl bg-cyan-500 shadow-md" onClick={() => fullscreenRef.current?.toggleFullscreen()}>Toggle fullscreen</button>
			<img src="https://picsum.photos/200/300" />
			<FullscreenContainer ref={fullscreenRef} className="from-rose-200 to-cyan-400 bg-gradient-to-tr" >
				<h1 className="text-5xl text-white text-outline-md-[#000]">This is Fullscreen</h1>
				<div className="w-1/3 h-1/3 relative object-contain bg-red-600">
					<CameraCanvas ref={cameraRef} objectFit="cover" />
				</div>
			</FullscreenContainer>
		</>
	);
}