import * as cv from "@techstark/opencv-js";
import * as tmImage from '@teachablemachine/image';
import { TilePredictionProps } from "../components/TilePrediction/TilePrediction";

export default class ImageProcessor
{
	static model: tmImage.CustomMobileNet;
	static modelBaseURL: string | null = null;

	static loadModel = async (baseURL: string = "/tm-my-image-model/") =>
	{
		const modelURL = baseURL + "model.json";
		const metadataURL = baseURL + "metadata.json";

		ImageProcessor.model = await tmImage.load(modelURL, metadataURL);
		ImageProcessor.modelBaseURL = baseURL;
	}

	static GetModel = async (baseURL: string = "/tm-my-image-model/") =>
	{
		if (ImageProcessor.model == null || ImageProcessor.modelBaseURL != baseURL)
		{
			await ImageProcessor.loadModel(baseURL);
		}
		return ImageProcessor.model;
	}

	static async ImageAsTiles({ inputCanvas, previewCanvas_1, previewCanvas_2, previewCanvas_3, modelURL }: {
		inputCanvas: HTMLCanvasElement;
		previewCanvas_1?: HTMLCanvasElement;
		previewCanvas_2?: HTMLCanvasElement;
		previewCanvas_3?: HTMLCanvasElement;
		modelURL?: string;
	}): Promise<TilePredictionProps[]>
	{
		const model = await this.GetModel(modelURL);
		const predProps: TilePredictionProps[] = [];

		try
		{
			console.log("Predicting...");
			let original = cv.imread(inputCanvas);

			// Convert to threshold image
			let thresh = new cv.Mat();
			cv.cvtColor(original, thresh, cv.COLOR_BGR2HSV, 0);
			cv.inRange(thresh,
				new cv.Mat(thresh.rows, thresh.cols, thresh.type(), [0, 0, 180, 0]),
				new cv.Mat(thresh.rows, thresh.cols, thresh.type(), [255, 90, 255, 0]),
				thresh);
			
			previewCanvas_1 && cv.imshow(previewCanvas_1, thresh);
			
			var contours = new cv.MatVector();
			var hierarchy = new cv.Mat();
			cv.findContours(thresh, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
			console.log("contours.size(): " + contours.size());

			for (let i = 0; i < (contours.size() as unknown as number); ++i)
			{
				const contour_area = cv.contourArea(contours.get(i));
				if (contour_area < 50)
					continue;
				
				cv.convexHull(contours.get(i), contours.get(i));

				const arclen = cv.arcLength(contours.get(i), true);
				const approx = new cv.Mat();
				cv.approxPolyDP(contours.get(i), approx, 0.1 * arclen, true);

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
				
				const approx_data = approx.data32S;
				const contour_center = {
					x: (approx_data[0] + approx_data[2] + approx_data[4] + approx_data[6]) / 4,
					y: (approx_data[1] + approx_data[3] + approx_data[5] + approx_data[7]) / 4
				}
				const extents = {
					width: Math.max(approx_data[0], approx_data[2], approx_data[4], approx_data[6]) - Math.min(approx_data[0], approx_data[2], approx_data[4], approx_data[6]),
					height: Math.max(approx_data[1], approx_data[3], approx_data[5], approx_data[7]) - Math.min(approx_data[1], approx_data[3], approx_data[5], approx_data[7])
				}
				// let minimum_dist = img.shape[0] * img.shape[1]
				// let maximum_dist = 0

				// for i in range(4):
				// 	val = math.dist(approx[i][0], center)
				// 	if (val < minimum):
				// 		minimum = val
				// 	if (val > maximum):
				// 			maximum = val
				
				let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, approx.data32S);
				let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, 0, 200, 200, 200, 200, 0]);
				const M = cv.getPerspectiveTransform(srcTri, dstTri);
				let warped = new cv.Mat();
				cv.warpPerspective(original, warped, M, new cv.Size(200, 200), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

				let average = 0;
				for (let i = 0; i < warped.rows; ++i)
				{
					for (let j = 0; j < warped.cols; ++j)
					{
						const pixel = warped.ucharPtr(i, j);
						if (pixel[0] < 64) pixel[0] = 0;
						else if (pixel[0] < 128) pixel[0] = 64;
						else pixel[0] = 255;
						if (pixel[1] < 64) pixel[1] = 0;
						else if (pixel[1] < 128) pixel[1] = 64;
						else pixel[1] = 255;
						if (pixel[2] < 64) pixel[2] = 0;
						else if (pixel[2] < 128) pixel[2] = 64;
						else pixel[2] = 255;

						average += pixel[0] + pixel[1] + pixel[2];
					}
				}

				average /= (warped.rows * warped.cols * 3);

				if (average < 64) // || average > 245  <-- does not work with white dragon
				{
					console.log("average is out of bounds", average);
					continue;
				}

				console.log("Contour is valid: avg " + average + ", area " + approx_area + ", contour area " + contour_area + ", approx rows " + approx.rows);

				previewCanvas_3 && cv.imshow(previewCanvas_3, warped);

				// Convert warped to an image bit map
				let bitmap = new ImageData(warped.cols, warped.rows);
				for (let i = 0; i < warped.rows; ++i)
				{
					for (let j = 0; j < warped.cols; ++j)
					{
						const pixel = warped.ucharPtr(i, j);
						const index = (i * warped.cols + j) * 4;
						bitmap.data[index] = pixel[0];
						bitmap.data[index + 1] = pixel[1];
						bitmap.data[index + 2] = pixel[2];
						bitmap.data[index + 3] = 255;
					}
				}

				const prediction = await model.predict(await createImageBitmap(bitmap));

				predProps.push({
					prediction: prediction,
					center: { x: contour_center.x / original.cols * 100, y: contour_center.y / original.rows * 100 },
					size: { width: extents.width / original.cols * 100, height: extents.height / original.rows * 100 },
					rect: approx.data32S.map((val, index) => index % 2 === 0 ? val / original.cols * 100 : val / original.rows * 100),
					referenceSize: { width: original.cols, height: original.rows },

					sourceImage: bitmap
				})

				M.delete();
				dstTri.delete();
				srcTri.delete();
				approx.delete();
			}
			original.delete();
			thresh.delete();
			contours.delete();
			hierarchy.delete();
		} catch (err)
		{
			console.log(err);
		}

		return predProps;
	}
}

