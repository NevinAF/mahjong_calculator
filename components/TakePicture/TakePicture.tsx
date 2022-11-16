import React from "react";
import FullscreenContainer from "../FullscreenContainer";

// Component that takes a picture from the webcam and displays it
export default class TakePicture extends React.Component<{ OnCapturePicture?: (arg0: HTMLCanvasElement) => void}, { takingPicture: boolean, isConfirming: boolean, videoStream: MediaStream | null, currentCamera: number, cameras: MediaDeviceInfo[], canvasContext: CanvasRenderingContext2D | null }>
{
	videoRef: React.RefObject<HTMLVideoElement>;
	canvasRef: React.RefObject<HTMLCanvasElement>;
	fullscreenContainer: React.RefObject<FullscreenContainer>;

	constructor(props: { OnCapturePicture?: (arg0: HTMLCanvasElement) => void })
	{
		super(props);

		this.videoRef = React.createRef<HTMLVideoElement>();
		this.canvasRef = React.createRef<HTMLCanvasElement>();
		this.fullscreenContainer = React.createRef<FullscreenContainer>();

		this.changeCamera = this.changeCamera.bind(this);
		this.takePicture = this.takePicture.bind(this);

		this.state = {
			takingPicture: false,
			isConfirming: false,
			videoStream: null,
			currentCamera: 0,
			cameras: [],
			canvasContext: null
		};
	}

	componentDidMount(): void
	{
		navigator.mediaDevices.enumerateDevices()
			.then((devices) =>
			{
				const cameras = devices.filter((device) => device.kind === "videoinput");
				this.setState({ cameras: cameras, currentCamera: 0 });
			})
			.catch((err) =>
			{
				console.log(err);
			});
		
		if (this.canvasRef.current)
		{
			this.setState({ canvasContext: this.canvasRef.current.getContext("2d") });
		}
	}

	changeCamera = () =>
	{
		if (this.state.videoStream)
		{
			this.state.videoStream.getTracks().forEach((track) => track.stop());
		}
		this.setState({ currentCamera: (this.state.currentCamera + 1) % this.state.cameras.length });

		navigator.mediaDevices.getUserMedia({ video: { deviceId: this.state.cameras[this.state.currentCamera].deviceId } })
			.then((stream) =>
			{
				this.setState({ videoStream: stream });
				if (this.videoRef.current)
				{
					this.videoRef.current.srcObject = stream;
				}
			})
			.catch((err) =>
			{
				console.log(err);
			});
	};

	// Take a picture
	takePicture = () =>
	{
		if (this.state.videoStream && this.state.canvasContext)
		{
			const video = this.videoRef.current;
			const canvas = this.canvasRef.current;
			if (video && canvas)
			{
				this.state.canvasContext.canvas.width = video.videoWidth;
				this.state.canvasContext.canvas.height = video.videoHeight;
				this.state.canvasContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

				this.setState({ isConfirming: true });
			}
		}
	};

	confirmPicture = () =>
	{
		if (this.canvasRef.current)
		{
			this.props.OnCapturePicture?.(this.canvasRef.current);
		}

		this.setState({ isConfirming: false });
	};

	cancelPicture = () =>
	{
		this.setState({ isConfirming: false });
	};

	// display the video stream and a canvas scaled to the size of the page
	render = () => (
		<>
			<div className={this.state.takingPicture ? "visible" : "hidden"}>
				<FullscreenContainer ref={this.fullscreenContainer}>
					<div className={`relative ${!this.state.isConfirming ? "visible" : "hidden"}`}>
						<button className="absolute right-0 w-28 h-16 text-lg bg-yellow-400 shadow-md" onClick={this.fullscreenContainer?.current?.toggleFullscreen}>Fullscreen</button>
						<button className="absolute right-0 top-16 w-28 h-16 text-lg bg-red-400 rounded-bl-lg shadow-md" onClick={() => this.setState({ takingPicture: false })}>Exit</button>
						<button className="absolute w-32 h-20 text-xl bg-pink-400 shadow-md" onClick={this.changeCamera}>Flip Camera</button>
						<button className="absolute w-32 h-20 left-32 text-xl bg-cyan-500 rounded-br-lg shadow-md" onClick={this.takePicture}>Take Picture</button>
						<video className="w-full pointer-events-none" ref={this.videoRef} autoPlay={true} />
					</div>
					<div className={`relative ${this.state.isConfirming ? "visible" : "hidden"}`}>
						<button className="absolute w-32 h-20 text-xl bg-red-500 shadow-md" onClick={this.cancelPicture}>Cancel</button>
						<button className="absolute w-32 h-20 left-32 text-xl bg-green-500 rounded-br-lg shadow-md" onClick={this.confirmPicture}>Confirm</button>
						<canvas className="w-full pointer-events-none" ref={this.canvasRef} />
					</div>
				</FullscreenContainer>
			</div>
			<button className={`w-32 h-20 text-xl bg-blue-500 rounded-lg shadow-md ${!this.state.takingPicture ? "visible" : "hidden"}`} onClick={() => { this.setState({ takingPicture: true }); this.changeCamera(); }}>Take Picture</button>
		</>
	);
}